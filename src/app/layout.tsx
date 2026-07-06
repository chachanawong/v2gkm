import type { Metadata } from "next";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "V2G KM",
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
    <html lang="th">
      <body>
        {children}
        <LoadingOverlay />
      </body>
    </html>
  );
}
