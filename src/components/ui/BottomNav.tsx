"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookImage,
  Plus,
  Gamepad2,
  Users,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { AddSheetItems } from "./AddSheetItems";

const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", Icon: Home },
  { href: "/recuerdos", label: "Recuerdos", Icon: BookImage },
  // placeholder para el botón "+"
  null,
  { href: "/juegos", label: "Juegos", Icon: Gamepad2 },
  { href: "/juntos", label: "Juntos", Icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="
          fixed bottom-0 left-0 right-0 z-30
          bg-card border-t border-line
          pb-[env(safe-area-inset-bottom)]
          flex items-end justify-around
          h-[calc(64px+env(safe-area-inset-bottom))]
          px-2
        "
      >
        {NAV_ITEMS.map((item) => {
          // Botón central "+"
          if (item === null) {
            return (
              <div key="add" className="flex flex-col items-center justify-end pb-2">
                <button
                  aria-label="Agregar"
                  onClick={() => setSheetOpen(true)}
                  className="
                    w-14 h-14 rounded-full bg-accent
                    flex items-center justify-center
                    shadow-card
                    active:scale-95 transition-transform duration-100
                    -mt-5
                  "
                >
                  <Plus size={28} strokeWidth={1.75} className="text-paper" />
                </button>
              </div>
            );
          }

          const { href, label, Icon } = item;
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className="
                flex flex-col items-center justify-end gap-0.5 pb-2
                min-w-[44px] min-h-[44px]
                transition-colors duration-150
              "
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={24}
                strokeWidth={1.75}
                className={active ? "text-accent" : "text-ink-2"}
              />
              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? "text-accent" : "text-ink-2"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="¿QUÉ CARGAMOS?"
      >
        <AddSheetItems onClose={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}
