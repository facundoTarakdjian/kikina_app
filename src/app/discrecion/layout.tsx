import type { Viewport } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { DiscrecionTheme } from "./DiscrecionTheme";

export const viewport: Viewport = {
  // Barra de estado iOS oscura cuando se está en Discreción
  themeColor: "#120A0B",
};

export default function DiscrecionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        Script inline: setea data-theme antes del primer paint para evitar flash.
        El componente DiscrecionTheme cubre las navegaciones SPA + cleanup al salir.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.theme='discrecion'`,
        }}
      />
      <DiscrecionTheme />

      <div className="flex flex-col min-h-dvh bg-paper">
        {/* Header: solo ✕ → /juntos */}
        <header
          className="flex items-center px-4 pb-2"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <Link
            href="/juntos"
            aria-label="Salir de Discreción"
            className="p-2 -ml-2 text-ink-2"
          >
            <X size={20} />
          </Link>
        </header>

        {children}
      </div>
    </>
  );
}
