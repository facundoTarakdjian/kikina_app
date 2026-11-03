"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { MilestoneResult } from "@/src/lib/milestones";

interface DayCounterProps {
  days: number;              // días de novios (o desde que se conocieron si no son novios)
  milestones: MilestoneResult;
  label: string;             // "DÍAS JUNTOS" | "DÍAS DESDE QUE NOS CONOCIMOS"
}

// SVG ring constants
const R = 88;
const SIZE = 200;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * R;

function RingProgress({ progress }: { progress: number }) {
  const reduced = useReducedMotion();
  const offset = CIRCUMFERENCE * (1 - (reduced ? progress : 0));
  const targetOffset = CIRCUMFERENCE * (1 - progress);

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (reduced) return;
    const el = circleRef.current;
    if (!el) return;
    // Set initial dashoffset (full circle = no fill)
    el.style.strokeDashoffset = String(CIRCUMFERENCE);
    // Trigger animation via requestAnimationFrame to ensure transition applies
    const raf = requestAnimationFrame(() => {
      el.style.strokeDashoffset = String(targetOffset);
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* Track */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke="var(--paper-2)"
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <circle
        ref={circleRef}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={reduced ? offset : CIRCUMFERENCE}
        style={
          reduced
            ? undefined
            : {
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
              }
        }
      />
    </svg>
  );
}

function CountUp({ target, reduced }: { target: number; reduced: boolean | null }) {
  // When reduced motion is on, display the final value immediately
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return; // show `target` directly via render below

    const start = performance.now();
    const duration = 900; // ms

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - (1 - t) ** 3;
      setDisplayed(Math.round(eased * target));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{reduced ? target : displayed}</>;
}

export function DayCounter({ days, milestones, label }: DayCounterProps) {
  const reduced = useReducedMotion();
  const { today: todayMilestone, next, daysUntil } = milestones;

  const isSpecialDay = todayMilestone !== null;

  // Texto de próximo hito
  let nextText: string;
  if (isSpecialDay) {
    nextText = todayMilestone!.label;
  } else if (daysUntil === 1) {
    nextText = `Mañana: ${next.label}`;
  } else {
    nextText = `${next.label} · en ${daysUntil} días`;
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Ring + number */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <RingProgress progress={milestones.progress} />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="text-score text-ink leading-none tabular-nums"
            aria-label={`${days} ${label}`}
          >
            <CountUp target={days} reduced={reduced} />
          </span>
          <span className="text-caption text-ink-2">{label}</span>
        </div>
      </div>

      {/* Milestone row */}
      <div
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors ${
          isSpecialDay
            ? "bg-accent-soft"
            : "bg-transparent"
        }`}
      >
        {isSpecialDay && (
          <span aria-hidden="true" className="text-base leading-none">✨</span>
        )}
        <span
          className={`text-small text-center ${
            isSpecialDay ? "text-accent font-medium" : "text-ink-2"
          }`}
        >
          {nextText}
        </span>
      </div>
    </div>
  );
}
