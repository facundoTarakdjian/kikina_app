"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-paper hover:bg-accent-deco active:scale-[.97] shadow-card",
  secondary:
    "bg-card text-ink border border-line hover:bg-paper-2 active:scale-[.97]",
  ghost:
    "bg-transparent text-ink-2 hover:text-ink hover:bg-paper-2 active:scale-[.97]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-3 text-small font-semibold min-h-[44px] rounded-btn",
  sm: "px-4 py-2 text-caption min-h-[36px] rounded-btn",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2 transition-all duration-150",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .join(" ")
          .trim()}
        {...props}
      >
        {children}
      </button>
    );
  },
);
