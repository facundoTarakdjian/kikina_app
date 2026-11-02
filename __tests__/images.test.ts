import { describe, it, expect } from "vitest";
import { fitDimensions } from "@/src/lib/images/compress";
import { buildStoragePath } from "@/src/lib/images/upload";

// ─── fitDimensions ───────────────────────────────────────────────────────────

describe("fitDimensions", () => {
  it("no cambia imagen que ya entra", () => {
    expect(fitDimensions(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });

  it("escala landscape por el ancho", () => {
    const { width, height } = fitDimensions(4000, 3000, 2048);
    expect(width).toBe(2048);
    expect(height).toBe(1536);
  });

  it("escala portrait por el alto", () => {
    const { width, height } = fitDimensions(3000, 4000, 2048);
    expect(width).toBe(1536);
    expect(height).toBe(2048);
  });

  it("escala cuadrada correctamente", () => {
    const { width, height } = fitDimensions(3000, 3000, 480);
    expect(width).toBe(480);
    expect(height).toBe(480);
  });

  it("imagen exactamente en el límite no cambia", () => {
    expect(fitDimensions(2048, 1024, 2048)).toEqual({ width: 2048, height: 1024 });
  });

  it("thumb 480 para landscape", () => {
    const { width, height } = fitDimensions(2048, 1536, 480);
    expect(width).toBe(480);
    expect(height).toBe(360);
  });
});

// ─── buildStoragePath ────────────────────────────────────────────────────────

describe("buildStoragePath", () => {
  const coupleId = "abc-123";
  const mediaId = "xyz-789";
  const date = new Date("2024-11-16T15:30:00Z");

  it("construye ruta main correctamente", () => {
    expect(buildStoragePath(coupleId, date, mediaId, "")).toBe(
      "abc-123/2024/11/xyz-789.webp",
    );
  });

  it("construye ruta thumb correctamente", () => {
    expect(buildStoragePath(coupleId, date, mediaId, "_thumb")).toBe(
      "abc-123/2024/11/xyz-789_thumb.webp",
    );
  });

  it("usa mes con cero a la izquierda", () => {
    const enero = new Date("2025-01-15T12:00:00Z");
    expect(buildStoragePath(coupleId, enero, mediaId, "")).toContain("/01/");
  });

  it("usa año correcto", () => {
    const fecha = new Date("2026-05-25T00:00:00Z");
    expect(buildStoragePath(coupleId, fecha, mediaId, "")).toContain("/2026/");
  });
});
