import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Young_Serif } from "next/font/google";
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
  title: "Ki<i",
  robots: { index: false, follow: false },
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
