import "./globals.css";

export const metadata = {
  title: "V2G Learning Platform",
  description: "V2G knowledge, announcements, admin, and Google Sheet database platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
