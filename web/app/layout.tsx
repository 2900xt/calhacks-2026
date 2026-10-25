import type { Metadata } from "next";
import { Mona_Sans, Newsreader } from "next/font/google";
import "./globals.css";

// Same pairing as the Stanford Fencing Analytics app: Newsreader headlines, Mona Sans body.
const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
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
        className={`${monaSans.variable} ${newsreader.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
