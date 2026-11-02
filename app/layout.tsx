import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ki<i",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
