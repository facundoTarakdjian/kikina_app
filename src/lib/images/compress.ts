/**
 * Compresión de imágenes en el browser:
 *  - HEIC → JPEG/PNG (lazy, solo si hace falta)
 *  - Resize con Canvas (lado mayor ≤ maxSide)
 *  - Output: image/webp con la calidad indicada
 */

/** Rutas de salida para la misma imagen */
export interface CompressResult {
  main: Blob;   // lado mayor 2048, q 0.8
  thumb: Blob;  // lado mayor 480,  q 0.7
  width: number;
  height: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

async function heicToBlob(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
  return Array.isArray(result) ? result[0] : result;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Calcula las dimensiones de salida manteniendo aspect ratio */
export function fitDimensions(
  w: number,
  h: number,
  maxSide: number,
): { width: number; height: number } {
  if (w <= maxSide && h <= maxSide) return { width: w, height: h };
  const ratio = w / h;
  if (w >= h) {
    return { width: maxSide, height: Math.round(maxSide / ratio) };
  }
  return { width: Math.round(maxSide * ratio), height: maxSide };
}

function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto 2D del canvas.");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Error al convertir el canvas a WebP."));
      },
      "image/webp",
      quality,
    );
  });
}

// ─── export ─────────────────────────────────────────────────────────────────

/**
 * Comprime `file` a WebP y devuelve la versión principal y la miniatura.
 *
 * Llamar DESPUÉS de readExif (el EXIF se pierde al pasar por canvas).
 */
export async function compress(file: File): Promise<CompressResult> {
  // 1. Convertir HEIC si hace falta
  const sourceBlob: Blob = isHeic(file) ? await heicToBlob(file) : file;

  // 2. Crear URL de objeto y cargar en <img>
  const url = URL.createObjectURL(sourceBlob);
  let img: HTMLImageElement;
  try {
    img = await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }

  const { naturalWidth: origW, naturalHeight: origH } = img;

  // 3. Dimensiones finales (lado mayor ≤ 2048)
  const { width, height } = fitDimensions(origW, origH, 2048);

  // 4. Main (2048, q 0.8)
  const mainCanvas = drawToCanvas(img, width, height);
  const main = await canvasToBlob(mainCanvas, 0.8);

  // 5. Thumb (480, q 0.7)
  const thumbDim = fitDimensions(width, height, 480);
  const thumbCanvas = drawToCanvas(img, thumbDim.width, thumbDim.height);
  const thumb = await canvasToBlob(thumbCanvas, 0.7);

  return { main, thumb, width, height };
}
