"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// Detecta si el usuario prefiere reducción de movimiento
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  // Opacidad del overlay se reduce conforme se arrastra hacia abajo
  const overlayOpacity = useTransform(dragY, [0, 300], [1, 0]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll del body cuando el sheet está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const reduced = prefersReducedMotion();

  const sheetVariants = {
    hidden: { y: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
    exit: { y: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 },
  };

  const transition = reduced
    ? { duration: 0.15 }
    : { type: "spring" as const, damping: 30, stiffness: 300 };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40"
            style={{ opacity: overlayOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Menú"}
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-card rounded-t-[24px] shadow-card
              pb-[env(safe-area-inset-bottom)]
              max-h-[90dvh] overflow-y-auto
            "
            style={{ y: dragY }}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              } else {
                dragY.set(0);
              }
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="w-9 h-1 rounded-full bg-line" />
            </div>

            {title && (
              <p className="text-caption text-ink-2 text-center pb-2">{title}</p>
            )}

            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
