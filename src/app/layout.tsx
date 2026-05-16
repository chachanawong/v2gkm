import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import "./globals.css";

const thai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2G KM",
  description: "V2G Knowledge Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={thai.variable}>
      <body>
        {children}
        <LoadingOverlay />
      </body>
    </html>
  );
}
