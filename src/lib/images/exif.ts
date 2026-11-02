import Exifr from "exifr";

export interface ExifResult {
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Intenta extraer una fecha de los primeros 8 dígitos continuos del nombre del archivo.
 * Patrones conocidos:
 *   IMG-20250525-WA0012   (WhatsApp)
 *   IMG_20250525_123456   (Android)
 *   PXL_20250525_123456   (Pixel)
 *   Screenshot_20250525-... / Screenshot_20250525_...
 * No usa file.lastModified: en fotos reenviadas refleja la descarga, no la toma.
 */
export function dateFromFilename(filename: string): Date | null {
  // Busca exactamente 8 dígitos contiguos precedidos por - o _ (o al inicio)
  const match = filename.match(/(?:^|[-_])(\d{4})(\d{2})(\d{2})(?=[-_.\s]|$)/);
  if (!match) return null;

  const [, yyyy, mm, dd] = match;
  const year = parseInt(yyyy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 2000 || year > 2100) return null;

  // Mediodía local para evitar desfases de TZ al solo tener la fecha
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Lee fecha y GPS de un File ANTES de comprimir.
 * Jerarquía de fecha:
 *   1. EXIF DateTimeOriginal
 *   2. EXIF CreateDate / DateTime
 *   3. Nombre del archivo (IMG-YYYYMMDD-…, PXL_…, Screenshot_…)
 *   4. null
 *
 * Nunca lanza.
 */
export async function readExif(file: File): Promise<ExifResult> {
  let takenAt: Date | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    const data = await Exifr.parse(file, {
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "DateTime",
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
      ],
      gps: true,
    });

    if (data) {
      takenAt =
        (data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : null) ??
        (data.CreateDate instanceof Date ? data.CreateDate : null) ??
        (data.DateTime instanceof Date ? data.DateTime : null);

      lat = typeof data.latitude === "number" ? data.latitude : null;
      lng = typeof data.longitude === "number" ? data.longitude : null;
    }
  } catch {
    // si exifr falla, seguimos al fallback de nombre
  }

  if (!takenAt) {
    takenAt = dateFromFilename(file.name);
  }

  return { takenAt, lat, lng };
}
