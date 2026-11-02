"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function SerwistInit({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      // scope="/" explícito: el SW en /serwist/sw.js controla toda la app.
      // El route handler ya devuelve "Service-Worker-Allowed: /".
      options={{ scope: "/" }}
      // reloadOnOnline=false: evita recargar mientras la pareja interactúa
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}
