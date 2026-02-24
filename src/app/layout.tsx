import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MVR — Founding Seats",
  description:
    "Built for real estate professionals who believe the best deals start with real relationships — not paid leads. Founding seats now open in Houston.",
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
