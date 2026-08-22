import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileProvider from "@/components/MobileProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "SmartHire AI — Intelligent Hiring Platform",
  description:
    "SmartHire AI is a next-generation AI-powered hiring platform that automates resume screening, candidate matching, and interview scheduling to help recruiters find the best talent faster.",
  keywords: [
    "AI hiring",
    "recruitment platform",
    "resume screening",
    "candidate matching",
    "SmartHire",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <MobileProvider>
          {children}
        </MobileProvider>
      </body>
    </html>
  );
}