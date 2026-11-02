import { createClient } from "@/src/lib/supabase/client";
import { readExif } from "./exif";
import { compress } from "./compress";
import { format } from "date-fns";

export interface UploadResult {
  mediaId: string;
  storagePath: string;
  thumbPath: string;
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
  originalBytes: number;
  compressedBytes: number;
  thumbBytes: number;
  width: number;
  height: number;
}

/** Ruta de Storage para un archivo de media */
export function buildStoragePath(
  coupleId: string,
  date: Date,
  mediaId: string,
  suffix: "" | "_thumb",
): string {
  const yyyy = format(date, "yyyy");
  const mm = format(date, "MM");
  return `media/${coupleId}/${yyyy}/${mm}/${mediaId}${suffix}.webp`;
}

/**
 * Pipeline completo:
 *  1. readExif (antes de comprimir)
 *  2. compress → main WebP + thumb WebP
 *  3. upload ambas a Storage
 *  4. insert fila en `media`
 *
 * Lanza con mensaje en rioplatense si falla la subida o la inserción.
 */
export async function uploadMedia(file: File): Promise<UploadResult> {
  const supabase = createClient();

  // ── Obtener couple_id del usuario logueado ───────────────────────────────
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Tenés que estar logueado para subir fotos.");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single();
  if (profErr || !profile) throw new Error("No se encontró tu perfil.");

  const coupleId = profile.couple_id;

  // ── 1. EXIF (antes de comprimir) ─────────────────────────────────────────
  const exif = await readExif(file);

  // ── 2. Comprimir ─────────────────────────────────────────────────────────
  const { main, thumb, width, height } = await compress(file);

  // ── 3. Preparar rutas ────────────────────────────────────────────────────
  const mediaId = crypto.randomUUID();
  const refDate = exif.takenAt ?? new Date();
  const storagePath = buildStoragePath(coupleId, refDate, mediaId, "");
  const thumbPath = buildStoragePath(coupleId, refDate, mediaId, "_thumb");

  // ── 4. Subir main ────────────────────────────────────────────────────────
  const { error: mainErr } = await supabase.storage
    .from("media")
    .upload(storagePath, main, { contentType: "image/webp", upsert: false });
  if (mainErr) {
    throw new Error(
      `No se pudo subir la foto. Revisá tu conexión y volvé a intentarlo. (${mainErr.message})`,
    );
  }

  // ── 5. Subir thumb ───────────────────────────────────────────────────────
  const { error: thumbErr } = await supabase.storage
    .from("media")
    .upload(thumbPath, thumb, { contentType: "image/webp", upsert: false });
  if (thumbErr) {
    // Intento borrar el main para no dejar huérfano
    await supabase.storage.from("media").remove([storagePath]);
    throw new Error(
      `No se pudo subir la miniatura. Revisá tu conexión y volvé a intentarlo. (${thumbErr.message})`,
    );
  }

  // ── 6. Insertar fila en media ────────────────────────────────────────────
  const { error: insertErr } = await supabase.from("media").insert({
    id: mediaId,
    couple_id: coupleId,
    kind: "photo",
    mime: "image/webp",
    storage_path: storagePath,
    thumb_path: thumbPath,
    width,
    height,
    bytes: main.size,
    taken_at: exif.takenAt?.toISOString() ?? null,
    lat: exif.lat,
    lng: exif.lng,
    original_name: file.name,
    created_by: user.id,
  });

  if (insertErr) {
    // Subidas hechas pero la fila no — limpiar Storage
    await supabase.storage.from("media").remove([storagePath, thumbPath]);
    throw new Error(
      `La foto se subió pero no se pudo guardar el registro. Contactá a Facu. (${insertErr.message})`,
    );
  }

  return {
    mediaId,
    storagePath,
    thumbPath,
    takenAt: exif.takenAt,
    lat: exif.lat,
    lng: exif.lng,
    originalBytes: file.size,
    compressedBytes: main.size,
    thumbBytes: thumb.size,
    width,
    height,
  };
}
