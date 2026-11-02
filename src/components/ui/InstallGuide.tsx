"use client";

import { useState, useSyncExternalStore } from "react";
import { X, Share, Plus, Smartphone } from "lucide-react";

const STORAGE_KEY = "kikina_install_guide_dismissed";

function isIPhoneBrowserSnapshot(): boolean {
  const isIPhone =
    /iphone/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const isStandalone =
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches;
  const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
  return isIPhone && !isStandalone && !dismissed;
}

// useSyncExternalStore evita setState-en-effect: el snapshot se lee directo en render.
// El servidor siempre devuelve false (no hay window).
function useIsIPhoneBrowser(): boolean {
  return useSyncExternalStore(
    () => () => {}, // no hay cambios externos que suscribir
    isIPhoneBrowserSnapshot,
    () => false, // SSR
  );
}

export function InstallGuide() {
  const isIPhoneBrowser = useIsIPhoneBrowser();
  const [dismissed, setDismissed] = useState(false);

  if (!isIPhoneBrowser || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Agregar a la pantalla de inicio"
      className="
        fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 right-4 z-50
        bg-card border border-line rounded-card shadow-card
        p-5 flex flex-col gap-4
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone size={20} strokeWidth={1.75} className="text-accent shrink-0" />
          <p className="text-h3 text-ink">Instalá Kikiña en tu iPhone</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="text-ink-2 hover:text-ink p-1 -mr-1 -mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* 3 pasos */}
      <ol className="flex flex-col gap-3">
        <Step
          number={1}
          icon={<Share size={18} strokeWidth={1.75} className="text-accent" />}
          text='Tocá "Compartir" en Safari'
        />
        <Step
          number={2}
          icon={<Plus size={18} strokeWidth={1.75} className="text-accent" />}
          text='"Agregar a inicio"'
        />
        <Step
          number={3}
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/icon-192.png"
              alt=""
              width={18}
              height={18}
              className="rounded"
            />
          }
          text="Abrí Kikiña desde ahí"
        />
      </ol>

      <button
        onClick={dismiss}
        className="text-small text-ink-2 underline underline-offset-2 text-center min-h-[44px]"
      >
        Ya lo hice / Lo hago después
      </button>
    </div>
  );
}

function Step({
  number,
  icon,
  text,
}: {
  number: number;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-6 h-6 rounded-full bg-accent-soft text-accent text-[11px] font-semibold flex items-center justify-center shrink-0">
        {number}
      </span>
      {icon}
      <span className="text-small text-ink">{text}</span>
    </li>
  );
}
