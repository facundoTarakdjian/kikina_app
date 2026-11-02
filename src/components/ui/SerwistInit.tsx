"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function SerwistInit({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      // reloadOnOnline=false: evita recargar la app mientras la pareja interactúa
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}
