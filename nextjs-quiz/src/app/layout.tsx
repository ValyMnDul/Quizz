import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz - Criticismul Junimist",
  description: "Testeaza-ti cunostintele despre societatea Junimea si Titu Maiorescu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
