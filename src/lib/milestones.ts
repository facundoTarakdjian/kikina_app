/**
 * Lógica pura de hitos para el DayCounter.
 * Sin dependencias de runtime: solo Intl + aritmética UTC.
 * Diseñado para usarse en el server component de Inicio
 * y ser testeable sin mocks de fecha (salvo todayInBA).
 */

export type MilestoneType =
  | "anniversary"       // aniversario de novios (25/5)
  | "met_anniversary"   // años desde que se conocieron (16/11)
  | "together_round"    // cada 100 días de novios
  | "met_round"         // cada 500 días desde que se conocieron
  | "together_month";   // cumplemés (el día de togetherOn de cada mes)

export interface Milestone {
  type: MilestoneType;
  date: string; // YYYY-MM-DD
  label: string;
}

export interface MilestoneResult {
  today: Milestone | null;  // hito que ocurre hoy, si hay
  next: Milestone;          // próximo hito (puede ser hoy si daysUntil === 0)
  daysUntil: number;        // 0 si es hoy, >0 en el futuro
  progress: number;         // 0..1 desde el hito anterior al próximo
}

/** Prioridad: menor índice = mayor prioridad */
const PRIORITY: MilestoneType[] = [
  "anniversary",
  "met_anniversary",
  "together_round",
  "met_round",
  "together_month",
];

// ── Helpers de fecha (UTC, sin dependencias de zona horaria) ─────────────────

function ymd(s: string): [number, number, number] {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return [y, m, d];
}

function toMs(s: string): number {
  const [y, m, d] = ymd(s);
  return Date.UTC(y, m - 1, d);
}

/** Suma n días a una fecha YYYY-MM-DD. */
export function addDays(s: string, n: number): string {
  const d = new Date(toMs(s) + n * 86_400_000);
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Días entre dos fechas YYYY-MM-DD (positivo si b > a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / 86_400_000);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ── Formato de números con separador de miles (1.000 estilo es-AR) ───────────

function fmtNum(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatYearsMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return m === 1 ? "1 mes" : `${m} meses`;
  const yStr = y === 1 ? "1 año" : `${y} años`;
  if (m === 0) return yStr;
  const mStr = m === 1 ? "1 mes" : `${m} meses`;
  return `${yStr} y ${mStr}`;
}

// ── Generadores de candidatos ────────────────────────────────────────────────

interface Candidate {
  milestone: Milestone;
  prev: string; // YYYY-MM-DD del hito anterior (para calcular progreso)
}

function yearlyCandidate(
  baseDate: string,
  today: string,
  type: MilestoneType,
  makeLabel: (n: number) => string,
): Candidate {
  const [by, bm, bd] = ymd(baseDate);
  const [ty] = ymd(today);

  let year = ty;
  let date = `${year}-${pad(bm)}-${pad(bd)}`;
  if (date < today) {
    year++;
    date = `${year}-${pad(bm)}-${pad(bd)}`;
  }
  const n = year - by;
  const prev = `${year - 1}-${pad(bm)}-${pad(bd)}`;

  return { milestone: { type, date, label: makeLabel(n) }, prev };
}

function roundCandidate(
  baseDate: string,
  today: string,
  interval: number,
  type: MilestoneType,
  makeLabel: (n: number) => string,
): Candidate {
  const totalDays = diffDays(baseDate, today);

  let days: number;
  if (totalDays <= 0) {
    days = interval;
  } else if (totalDays % interval === 0) {
    days = totalDays; // today is exactly a round milestone
  } else {
    days = Math.ceil(totalDays / interval) * interval;
  }

  const date = addDays(baseDate, days);
  const prev = addDays(baseDate, Math.max(0, days - interval));

  return { milestone: { type, date, label: makeLabel(days) }, prev };
}

function cumplemesCandidate(
  togetherOn: string,
  today: string,
): Candidate | null {
  const [toy, tom, tod] = ymd(togetherOn);
  const [ty, tm] = ymd(today);

  let targetYear = ty;
  let targetMonth = tm;
  let date = `${targetYear}-${pad(targetMonth)}-${pad(tod)}`;

  // Avanzar hasta que date >= today Y monthsN >= 1
  let iterations = 0;
  while (
    (date < today || (targetYear * 12 + targetMonth) - (toy * 12 + tom) < 1) &&
    iterations < 25
  ) {
    targetMonth++;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear++;
    }
    date = `${targetYear}-${pad(targetMonth)}-${pad(tod)}`;
    iterations++;
  }

  const monthsN = (targetYear * 12 + targetMonth) - (toy * 12 + tom);
  if (monthsN < 1) return null;

  let prevYear = targetYear;
  let prevMonth = targetMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }
  const prev = `${prevYear}-${pad(prevMonth)}-${pad(tod)}`;

  return {
    milestone: {
      type: "together_month",
      date,
      label: `${formatYearsMonths(monthsN)} de novios`,
    },
    prev,
  };
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Calcula hitos a partir de las fechas de la pareja y la fecha de hoy.
 * @param metOn       YYYY-MM-DD — cuando se conocieron
 * @param togetherOn  YYYY-MM-DD | null — cuando se pusieron de novios
 * @param today       YYYY-MM-DD — calculado con todayInBA() en el servidor
 */
export function computeMilestones(
  metOn: string,
  togetherOn: string | null,
  today: string,
): MilestoneResult {
  const candidates: Candidate[] = [];

  if (togetherOn) {
    // 1. Aniversario de novios
    candidates.push(
      yearlyCandidate(togetherOn, today, "anniversary", (n) =>
        `${n === 1 ? "1 año" : `${n} años`} de novios`,
      ),
    );

    // 3. Número redondo cada 100 días de novios
    candidates.push(
      roundCandidate(togetherOn, today, 100, "together_round", (n) =>
        `${fmtNum(n)} días de novios`,
      ),
    );

    // 5. Cumplemés
    const cumple = cumplemesCandidate(togetherOn, today);
    if (cumple) candidates.push(cumple);
  }

  // 2. Aniversario de conocidos
  candidates.push(
    yearlyCandidate(metOn, today, "met_anniversary", (n) =>
      `${n === 1 ? "1 año" : `${n} años`} desde que nos conocimos`,
    ),
  );

  // 4. Número redondo cada 500 días desde que se conocieron
  candidates.push(
    roundCandidate(metOn, today, 500, "met_round", (n) =>
      `${fmtNum(n)} días desde que nos conocimos`,
    ),
  );

  // Ordenar: primero por fecha (asc), luego por prioridad (asc = mayor prioridad)
  candidates.sort((a, b) => {
    if (a.milestone.date < b.milestone.date) return -1;
    if (a.milestone.date > b.milestone.date) return 1;
    return (
      PRIORITY.indexOf(a.milestone.type) - PRIORITY.indexOf(b.milestone.type)
    );
  });

  const winner = candidates[0]!;
  const isToday = winner.milestone.date === today;
  const daysUntil = diffDays(today, winner.milestone.date);

  // Progreso: (hoy − prevHito) / (nextHito − prevHito)
  const prevMs = toMs(winner.prev);
  const nextMs = toMs(winner.milestone.date);
  const todayMs = toMs(today);
  const span = nextMs - prevMs;
  const progress =
    span > 0 ? Math.min(1, Math.max(0, (todayMs - prevMs) / span)) : 1;

  return {
    today: isToday ? winner.milestone : null,
    next: winner.milestone,
    daysUntil,
    progress,
  };
}

// ── Fecha de hoy en Buenos Aires ─────────────────────────────────────────────

/**
 * Devuelve la fecha actual en America/Argentina/Buenos_Aires como YYYY-MM-DD.
 * Funciona igual en el servidor de Vercel (UTC) y en cualquier dispositivo.
 */
export function todayInBA(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
