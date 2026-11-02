"use client";

import {
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { Button } from "@/src/components/ui/Button";
import { sendOtp, verifyOtp } from "../actions";

// ─── Paso 1: ingreso de mail ────────────────────────────────────────────────

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendOtp(null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        onSent(email);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small text-ink-2">
          Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@mail.com"
          className="
            w-full px-4 py-3 rounded-btn bg-card border border-line
            text-small text-ink placeholder:text-ink-2
            focus:border-accent focus:outline-none
            min-h-[44px]
          "
        />
      </div>

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Enviando…" : "Mandame el código"}
      </Button>
    </form>
  );
}

// ─── Paso 2: 6 casillas OTP ─────────────────────────────────────────────────

function OtpStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateDigits(next: string[]) {
    setDigits(next);
    return next;
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    updateDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();

    if (pasted.length === 6) {
      submitToken(pasted);
    }
  }

  function submitToken(token: string) {
    setError(null);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("token", token);
    startTransition(async () => {
      const result = await verifyOtp(null, fd);
      if (result?.error) setError(result.error);
      // Si no hay error, verifyOtp hizo redirect → no hace falta hacer nada acá
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitToken(digits.join(""));
  }

  const token = digits.join("");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <p className="text-small text-ink-2 text-center">
        Enviamos el código a{" "}
        <span className="text-ink font-medium">{email}</span>.
      </p>

      {/* Campo oculto para autocompletar one-time-code del sistema */}
      <input
        type="text"
        autoComplete="one-time-code"
        value={token}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
          const next = Array(6)
            .fill("")
            .map((_, i) => val[i] ?? "");
          updateDigits(next);
          if (val.length === 6) submitToken(val);
        }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* 6 casillas visibles */}
      <div
        className="flex gap-2 justify-center"
        role="group"
        aria-label="Código de 6 dígitos"
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Dígito ${i + 1}`}
            className="
              w-11 h-14 text-center rounded-btn bg-card border border-line
              text-h2 text-ink caret-accent
              focus:border-accent focus:outline-none
              min-w-[44px]
            "
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-small text-danger text-center">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={pending || token.length < 6}
        className="w-full"
      >
        {pending ? "Verificando…" : "Entrar"}
      </Button>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-small text-ink-2 underline underline-offset-2 min-h-[44px] px-2"
        >
          Cambiar mail
        </button>
        <span className="text-ink-2" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          onClick={onBack}
          className="text-small text-ink-2 underline underline-offset-2 min-h-[44px] px-2"
        >
          Reenviar
        </button>
      </div>
    </form>
  );
}

// ─── Página de login ─────────────────────────────────────────────────────────

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");

  function handleSent(sentEmail: string) {
    setEmail(sentEmail);
    setStep("otp");
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/koala.svg"
            alt="Koala de Kikiña"
            width={80}
            height={80}
            className="select-none"
          />
          <Wordmark className="text-[2rem]" />
        </div>

        {step === "email" ? (
          <EmailStep onSent={handleSent} />
        ) : (
          <OtpStep email={email} onBack={() => setStep("email")} />
        )}
      </div>
    </main>
  );
}
