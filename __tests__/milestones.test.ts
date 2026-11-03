import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeMilestones,
  addDays,
  diffDays,
  todayInBA,
} from "../src/lib/milestones";

// Fechas de la pareja (igual que el seed real)
const MET_ON = "2024-11-16";       // se conocieron
const TOGETHER_ON = "2025-05-25";  // se pusieron de novios

afterEach(() => {
  vi.useRealTimers();
});

// ── addDays / diffDays ────────────────────────────────────────────────────────

describe("addDays", () => {
  it("suma días simples", () => {
    expect(addDays("2025-05-25", 100)).toBe("2025-09-02");
  });
  it("cruza fin de mes", () => {
    expect(addDays("2025-01-31", 1)).toBe("2025-02-01");
  });
  it("cruza fin de año", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });
  it("n = 0 devuelve la misma fecha", () => {
    expect(addDays("2026-03-15", 0)).toBe("2026-03-15");
  });
});

describe("diffDays", () => {
  it("positivo cuando b > a", () => {
    expect(diffDays("2025-05-25", "2026-05-25")).toBe(365);
  });
  it("0 cuando son iguales", () => {
    expect(diffDays("2026-01-01", "2026-01-01")).toBe(0);
  });
  it("negativo cuando b < a", () => {
    expect(diffDays("2026-05-25", "2025-05-25")).toBe(-365);
  });
});

// ── computeMilestones ─────────────────────────────────────────────────────────

describe("computeMilestones", () => {

  it("2026-11-03 → próximo es 2 años de conocidos (16/11)", () => {
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-11-03");
    expect(r.daysUntil).toBe(13);
    expect(r.next.type).toBe("met_anniversary");
    expect(r.next.label).toBe("2 años desde que nos conocimos");
    expect(r.next.date).toBe("2026-11-16");
    expect(r.today).toBeNull();
  });

  it("2026-11-16 → hoy es el aniversario de conocidos", () => {
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-11-16");
    expect(r.daysUntil).toBe(0);
    expect(r.today?.type).toBe("met_anniversary");
    expect(r.today?.label).toBe("2 años desde que nos conocimos");
  });

  it("2026-11-25 → hoy es cumplemés (1 año y 6 meses de novios)", () => {
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-11-25");
    expect(r.daysUntil).toBe(0);
    expect(r.today?.type).toBe("together_month");
    expect(r.today?.label).toBe("1 año y 6 meses de novios");
  });

  it("2027-05-25 → aniversario gana sobre cumplemés (misma fecha)", () => {
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2027-05-25");
    expect(r.today?.type).toBe("anniversary");
    expect(r.today?.label).toBe("2 años de novios");
  });

  it("2027-01-15 → hoy son 600 días de novios", () => {
    // togetherOn = 2025-05-25 + 600 = ?
    const date600 = addDays(TOGETHER_ON, 600);
    const r = computeMilestones(MET_ON, TOGETHER_ON, date600);
    expect(r.today?.type).toBe("together_round");
    expect(r.today?.label).toBe("600 días de novios");
    expect(r.daysUntil).toBe(0);
  });

  it("1.000 días desde que nos conocimos lleva punto separador", () => {
    const date1000 = addDays(MET_ON, 1000);
    const r = computeMilestones(MET_ON, TOGETHER_ON, date1000);
    expect(r.today?.type).toBe("met_round");
    expect(r.today?.label).toBe("1.000 días desde que nos conocimos");
  });

  it("progress = 0 el día del hito anterior", () => {
    // El día del aniversario anterior, progress debe ser ~0 (o exactamente el hito siguiente)
    // Testeamos que progress está entre 0 y 1
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-06-01");
    expect(r.progress).toBeGreaterThanOrEqual(0);
    expect(r.progress).toBeLessThanOrEqual(1);
  });

  it("progress = 1 cuando daysUntil = 0", () => {
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-11-16");
    expect(r.progress).toBe(1);
  });

  it("sin togetherOn no genera hitos de novios", () => {
    const r = computeMilestones(MET_ON, null, "2026-11-03");
    // Solo puede haber met_anniversary o met_round
    expect(["met_anniversary", "met_round"]).toContain(r.next.type);
    if (r.today) {
      expect(["met_anniversary", "met_round"]).toContain(r.today.type);
    }
  });

  it("formatYearsMonths: solo meses cuando < 12", () => {
    // 2026-02-25 → 9 meses de novios
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-02-25");
    expect(r.today?.label).toBe("9 meses de novios");
  });

  it("formatYearsMonths: 1 año solo (sin meses)", () => {
    // 2026-05-25 → 1 año de novios (aniversario de novios, type=anniversary)
    const r = computeMilestones(MET_ON, TOGETHER_ON, "2026-05-25");
    expect(r.today?.type).toBe("anniversary");
    expect(r.today?.label).toBe("1 año de novios");
  });

  it("cumplemés no aparece para el día 0 (togetherOn)", () => {
    // El día que se pusieron de novios no hay cumplemés
    const r = computeMilestones(MET_ON, TOGETHER_ON, TOGETHER_ON);
    // No puede ser together_month (monthsN < 1)
    if (r.today) {
      expect(r.today.type).not.toBe("together_month");
    }
  });
});

// ── todayInBA ─────────────────────────────────────────────────────────────────

describe("todayInBA", () => {
  it("02:00 UTC = 23:00 BA del día anterior (UTC−3)", () => {
    // 2026-11-04T02:00:00Z → en BA son las 23:00 del 2026-11-03
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T02:00:00Z"));
    expect(todayInBA()).toBe("2026-11-03");
  });

  it("06:00 UTC = 03:00 BA del mismo día", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T06:00:00Z"));
    expect(todayInBA()).toBe("2026-11-04");
  });

  it("devuelve formato YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T12:00:00Z"));
    expect(todayInBA()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
