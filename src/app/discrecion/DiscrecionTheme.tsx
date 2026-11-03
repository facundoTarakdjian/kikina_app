"use client";

import { useEffect } from "react";

/**
 * Fuerza data-theme="discrecion" en <html> mientras el usuario está en /discrecion/*.
 * El script inline del layout lo setea antes del paint (evita flash); este componente
 * lo setea también en navegaciones SPA y lo limpia al salir.
 */
export function DiscrecionTheme() {
  useEffect(() => {
    document.documentElement.dataset.theme = "discrecion";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);
  return null;
}
