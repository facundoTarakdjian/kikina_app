export type DieName = "accion" | "zona" | "modo";

export interface DiceFace {
  id: string;
  die: DieName;
  min_level: number;
  text: string;
}

/**
 * Tira un dado y devuelve una cara válida para el nivel dado.
 *
 * Lógica de selección:
 * - Solo caras con min_level <= level son válidas.
 * - 60 % de probabilidad de elegir del grupo "al nivel" (min_level === level),
 *   40 % del grupo "por debajo" (min_level < level).
 * - Si un grupo está vacío, se usa el otro.
 * - Si hay más de una opción disponible, se evita repetir la cara anterior.
 *
 * @param faces   Todas las caras del dado (un solo die, ya filtradas por die name).
 * @param level   Nivel activo (1–4).
 * @param lastFaceId  ID de la cara que salió en la tirada anterior (para evitar repetir).
 * @param random  Función de aleatoriedad inyectable (default: Math.random).
 */
export function rollDie(
  faces: DiceFace[],
  level: number,
  lastFaceId?: string,
  random: () => number = Math.random,
): DiceFace {
  const valid = faces.filter((f) => f.min_level <= level);
  if (valid.length === 0) {
    throw new Error(`rollDie: sin caras válidas para nivel ${level}`);
  }

  const atLevel = valid.filter((f) => f.min_level === level);
  const below = valid.filter((f) => f.min_level < level);

  // Elegir grupo: 60 % al nivel, 40 % por debajo; fallback si uno está vacío
  let group: DiceFace[];
  if (atLevel.length === 0) {
    group = below;
  } else if (below.length === 0) {
    group = atLevel;
  } else {
    group = random() < 0.6 ? atLevel : below;
  }

  // Evitar repetir la cara anterior si el grupo tiene más de una opción
  let pool = group;
  if (lastFaceId !== undefined && group.length > 1) {
    const filtered = group.filter((f) => f.id !== lastFaceId);
    if (filtered.length > 0) pool = filtered;
  }

  return pool[Math.floor(random() * pool.length)]!;
}
