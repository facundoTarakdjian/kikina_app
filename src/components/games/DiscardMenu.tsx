"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

interface DiscardMenuProps {
  onDiscard: () => void;
}

export function DiscardMenu({ onDiscard }: DiscardMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  function handleOpen() {
    setOpen(true);
    setConfirm(false);
  }

  function handleClose() {
    setOpen(false);
    setConfirm(false);
  }

  function handleDiscardTap() {
    if (confirm) {
      handleClose();
      onDiscard();
    } else {
      setConfirm(true);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Opciones de partida"
        className="p-2 -mr-2 text-ink-2"
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-sm bg-card rounded-t-2xl shadow-xl px-6 pt-5"
            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-line" />
            </div>

            {confirm ? (
              <>
                <p className="text-h3 text-ink text-center mb-1">
                  ¿Descartamos esta partida?
                </p>
                <p className="text-small text-ink-2 text-center mb-6">
                  No cuenta para nadie.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDiscardTap}
                    className="w-full py-4 rounded-xl bg-accent text-paper text-ui"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-4 rounded-xl bg-paper-2 text-ink text-ui"
                  >
                    Seguir jugando
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleDiscardTap}
                  className="w-full py-4 text-left text-ui text-ink border-b border-line"
                >
                  Descartar partida
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-4 text-left text-small text-ink-2"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
