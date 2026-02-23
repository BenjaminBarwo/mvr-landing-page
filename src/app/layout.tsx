import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MVR — Secure Your ZIP Territory",
  description:
    "Houston's first ZIP-locked professional routing platform. Secure your founding seat before launch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body
        className={`${inter.variable} antialiased`}
        style={{ background: "#f2f3f5", color: "#222" }}
      >
        {children}
      </body>
    </html>
  );
}
