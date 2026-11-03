import type { Viewport } from "next";
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
        {/* Cada página dentro de /discrecion renderiza su propio header con la navegación correcta */}
        {children}
      </div>
    </>
  );
}
