import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Notebook",
  description: "a living chart of how machines learned to think",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
