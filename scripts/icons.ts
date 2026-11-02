/**
 * scripts/icons.ts — genera los íconos de la PWA a partir del koala de Noto Emoji.
 *
 * Uso: pnpm icons
 * Output:
 *   public/brand/icon-192.png          koala ~65% sobre crema, esquinas redondeadas
 *   public/brand/icon-512.png          idem, 512px
 *   public/brand/maskable-512.png      koala ~55% (zona segura Android maskable)
 *   public/brand/apple-touch-icon.png  180px, sin transparencia
 *   public/favicon.svg                 koala SVG reusado como favicon
 *
 * Koala: Noto Emoji, © Google, Apache License 2.0
 * https://github.com/googlefonts/noto-emoji
 */

import sharp from "sharp";
import { existsSync } from "node:fs";
import { copyFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const KOALA = path.join(ROOT, "public/brand/koala.svg");
const OUT = path.join(ROOT, "public/brand");
const CREAM = { r: 247, g: 242, b: 234, alpha: 1 }; // #F7F2EA = --paper claro

if (!existsSync(KOALA)) {
  console.error("❌ public/brand/koala.svg no existe. Descargalo primero.");
  process.exit(1);
}

interface IconSpec {
  file: string;
  size: number;       // tamaño total del canvas
  koalaRatio: number; // fracción del canvas que ocupa el koala
  borderRadius?: number; // píxeles de borde redondeado (0 = sin redondear)
}

const SPECS: IconSpec[] = [
  { file: "icon-192.png",         size: 192, koalaRatio: 0.65, borderRadius: 40  },
  { file: "icon-512.png",         size: 512, koalaRatio: 0.65, borderRadius: 108 },
  { file: "maskable-512.png",     size: 512, koalaRatio: 0.55, borderRadius: 0   },
  { file: "apple-touch-icon.png", size: 180, koalaRatio: 0.65, borderRadius: 0   },
];

async function makeIcon(spec: IconSpec): Promise<void> {
  const { file, size, koalaRatio, borderRadius = 0 } = spec;
  const koalaSize = Math.round(size * koalaRatio);
  const offset = Math.round((size - koalaSize) / 2);

  // 1. Redimensionar el koala SVG a koalaSize × koalaSize
  const koalaPng = await sharp(KOALA, { density: 300 })
    .resize(koalaSize, koalaSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. Canvas crema
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: CREAM,
    },
  });

  // 3. Componer: fondo crema + koala centrado
  let composed = canvas.composite([
    { input: koalaPng, top: offset, left: offset },
  ]);

  // 4. Borde redondeado (recorte con máscara SVG)
  if (borderRadius > 0) {
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}">` +
        `<rect rx="${borderRadius}" ry="${borderRadius}" width="${size}" height="${size}" fill="white"/>` +
        `</svg>`,
    );
    composed = composed.composite([{ input: mask, blend: "dest-in" }]);
  }

  const outPath = path.join(OUT, file);
  await composed.png().toFile(outPath);
  console.log(`✓ ${file} (${size}×${size}, koala ${Math.round(koalaRatio * 100)}%)`);
}

async function main() {
  console.log("Generando íconos PWA del koala de Noto Emoji…\n");

  for (const spec of SPECS) {
    await makeIcon(spec);
  }

  // favicon.svg = el mismo koala SVG, no necesita procesamiento
  const faviconDest = path.join(ROOT, "public/favicon.svg");
  copyFileSync(KOALA, faviconDest);
  console.log("✓ favicon.svg (copia de koala.svg)");

  console.log("\n✅ Listo. Íconos en public/brand/ y public/favicon.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
