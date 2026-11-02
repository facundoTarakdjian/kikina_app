import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Young_Serif } from "next/font/google";
import { SerwistInit } from "@/src/components/ui/SerwistInit";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kikiña",
  applicationName: "Kikiña",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Ki<i",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`h-full ${fraunces.variable} ${instrumentSans.variable} ${youngSerif.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
      </head>
      <body className="min-h-full">
        <SerwistInit>{children}</SerwistInit>
      </body>
    </html>
  );
}
