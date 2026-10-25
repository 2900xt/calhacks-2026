"""Standby mode: BeInvolved as a long-lived HTTP API and a stateless MCP server.

- GET  /         readiness probe, or a short description of the API
- GET  /scan     ?interests=a|b&jurisdictions=berkeley,oakland&daysAhead=21 -> JSON matches
- POST /mcp      MCP over Streamable HTTP (stateless JSON responses), with two tools
"""

from __future__ import annotations

import asyncio
import json

from aiohttp import web
from apify import Actor

from .main import PRESETS, scan

PROTOCOL_VERSIONS = ('2025-06-18', '2025-03-26', '2024-11-05')

TOOLS = [
    {
        'name': 'find_agenda_items',
        'title': 'Find upcoming city council agenda items',
        'description': (
            'Reads upcoming city council agendas (Berkeley, Oakland, San José, Alameda, Mountain View, '
            'Sunnyvale, or any Legistar city) and returns the items that match the given interests, ranked by '
            'relevance, each with a plain-English summary, meeting date, action type and a link to the staff report.'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'interests': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Topics the resident cares about, in plain English'},
                'jurisdictions': {'type': 'array', 'items': {'type': 'string', 'enum': list(PRESETS)}, 'description': 'Preset cities to read'},
                'extraLegistarClients': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Other Legistar slugs, e.g. "seattle"'},
                'daysAhead': {'type': 'integer', 'minimum': 0, 'maximum': 90, 'default': 21},
                'minRelevance': {'type': 'number', 'minimum': 0, 'maximum': 1, 'default': 0.5},
            },
            'required': ['interests'],
        },
        'annotations': {'readOnlyHint': True, 'openWorldHint': True},
    },
    {
        'name': 'list_jurisdictions',
        'title': 'List supported jurisdictions',
        'description': 'Lists the preset jurisdictions and the agenda platform each one is read from.',
        'inputSchema': {'type': 'object', 'properties': {}},
        'annotations': {'readOnlyHint': True},
    },
]


async def index(request: web.Request) -> web.Response:
    if 'x-apify-container-server-readiness-probe' in request.headers:
        return web.Response(text='ok')
    return web.json_response({
        'name': 'BeInvolved',
        'endpoints': {'scan': 'GET /scan?interests=a|b&jurisdictions=berkeley,oakland', 'mcp': 'POST /mcp'},
        'jurisdictions': list(PRESETS),
    })


async def scan_http(request: web.Request) -> web.Response:
    q = request.query
    inp = {
        'interests': [s for s in q.get('interests', '').split('|') if s.strip()],
        'jurisdictions': [s for s in q.get('jurisdictions', 'berkeley,oakland').split(',') if s.strip()],
        'daysAhead': int(q.get('daysAhead', 21)),
        'minRelevance': float(q.get('minRelevance', 0.5)),
    }
    try:
        result = await scan(inp)
    except ValueError as err:
        return web.json_response({'error': str(err)}, status=400)
    await _charge_matches(result.matches)
    return web.json_response(result.summary())


async def mcp(request: web.Request) -> web.Response:
    try:
        msg = await request.json()
    except json.JSONDecodeError:
        return _rpc_error(None, -32700, 'Parse error')
    if isinstance(msg, list):
        return _rpc_error(None, -32600, 'Batch requests are not supported')

    method, rid, params = msg.get('method'), msg.get('id'), msg.get('params') or {}
    if rid is None:  # notification, e.g. notifications/initialized
        return web.Response(status=202)

    if method == 'initialize':
        requested = params.get('protocolVersion')
        return _rpc_result(rid, {
            'protocolVersion': requested if requested in PROTOCOL_VERSIONS else PROTOCOL_VERSIONS[0],
            'capabilities': {'tools': {'listChanged': False}},
            'serverInfo': {'name': 'beinvolved', 'title': 'BeInvolved', 'version': '1.0.0'},
            'instructions': 'Call find_agenda_items with the resident\'s interests to see what their city council will decide soon.',
        })
    if method == 'ping':
        return _rpc_result(rid, {})
    if method == 'tools/list':
        return _rpc_result(rid, {'tools': TOOLS})
    if method == 'tools/call':
        return await _call_tool(rid, params.get('name'), params.get('arguments') or {})
    return _rpc_error(rid, -32601, f'Method not found: {method}')


async def _call_tool(rid, name: str, args: dict) -> web.Response:
    if name == 'list_jurisdictions':
        listing = {slug: {'name': n, 'platform': p} for slug, (p, n) in PRESETS.items()}
        return _rpc_result(rid, _tool_content(listing))
    if name != 'find_agenda_items':
        return _rpc_error(rid, -32602, f'Unknown tool: {name}')
    try:
        result = await scan({**args, 'minRelevance': args.get('minRelevance', 0.5)})
    except ValueError as err:
        return _rpc_result(rid, {'content': [{'type': 'text', 'text': str(err)}], 'isError': True})
    await _charge_matches(result.matches)
    summary = result.summary()
    return _rpc_result(rid, {
        'content': [{'type': 'text', 'text': summary['digest']}, {'type': 'text', 'text': json.dumps(summary['matches'])}],
        'structuredContent': summary,
    })


async def _charge_matches(matches: list[dict]) -> None:
    if matches:
        await Actor.charge('relevant-item-found', count=len(matches))


def _tool_content(data) -> dict:
    return {'content': [{'type': 'text', 'text': json.dumps(data)}], 'structuredContent': data}


def _rpc_result(rid, result) -> web.Response:
    return web.json_response({'jsonrpc': '2.0', 'id': rid, 'result': result})


def _rpc_error(rid, code: int, message: str) -> web.Response:
    return web.json_response({'jsonrpc': '2.0', 'id': rid, 'error': {'code': code, 'message': message}})


async def serve() -> None:
    app = web.Application()
    app.router.add_get('/', index)
    app.router.add_get('/scan', scan_http)
    app.router.add_post('/mcp', mcp)
    app.router.add_get('/mcp', lambda _: web.Response(status=405, headers={'Allow': 'POST'}))
    runner = web.AppRunner(app)
    await runner.setup()
    port = Actor.configuration.web_server_port
    await web.TCPSite(runner, '0.0.0.0', port).start()
    Actor.log.info(f'BeInvolved Standby server listening on port {port} (MCP at /mcp)')
    while True:  # Standby runs are stopped by the platform when idle.
        await asyncio.sleep(3600)
