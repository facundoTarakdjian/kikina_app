import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluir:
     *  - Todo _next/ (chunks, static, image, etc.)
     *  - Rutas públicas de la PWA: manifest, SW, íconos, brand, robots, favicon
     *  - Archivos estáticos por extensión (imágenes, fuentes, audio, vídeo)
     *
     * Chrome pide manifest.webmanifest, /serwist/*.js e íconos sin cookies
     * durante el proceso de instalación. Si el proxy los intercepta, redirige
     * a /login y la instalación falla.
     */
    "/((?!_next/|serwist/|manifest\\.webmanifest|robots\\.txt|favicon|apple-touch-icon|brand/|splash/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|mp3|mp4|webm)$).*)",
  ],
};
