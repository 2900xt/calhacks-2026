import type { Metadata } from "next";
import { Fragment_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Sequoia's site uses Pitch Sans (a licensed Klim typeface) with Fragment Mono; Space Grotesk is the closest free match.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeInvolved",
  description: "Your city decides things every week. Find the decisions that affect you and have a say.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${fragmentMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
