import Exifr from "exifr";

export interface ExifResult {
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Lee DateTimeOriginal y GPS de un File ANTES de comprimir.
 * exifr trabaja sobre el buffer original, por lo que si se llama
 * después de comprimir (canvas → WebP) ya no hay metadatos.
 *
 * Nunca lanza: si no hay EXIF o falla, devuelve null en todos los campos.
 */
export async function readExif(file: File): Promise<ExifResult> {
  try {
    const data = await Exifr.parse(file, {
      pick: [
        "DateTimeOriginal",
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
      ],
      gps: true,
    });

    if (!data) return { takenAt: null, lat: null, lng: null };

    const takenAt =
      data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : null;

    // exifr resuelve lat/lng a decimales cuando gps:true
    const lat = typeof data.latitude === "number" ? data.latitude : null;
    const lng = typeof data.longitude === "number" ? data.longitude : null;

    return { takenAt, lat, lng };
  } catch {
    return { takenAt: null, lat: null, lng: null };
  }
}
