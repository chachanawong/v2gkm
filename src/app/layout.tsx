import type { Metadata } from "next";
import localFont from "next/font/local";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import "./globals.css";

const googleSans = localFont({
  src: [
    {
      path: "./fonts/GoogleSans-Variable.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/GoogleSans-Italic-Variable.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2G Learning Center",
  description: "V2G Knowledge Management",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={googleSans.variable}>
      <body>
        {children}
        <LoadingOverlay />
      </body>
    </html>
  );
}
