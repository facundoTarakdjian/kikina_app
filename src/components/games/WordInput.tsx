"use client";

interface WordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function WordInput({
  value,
  onChange,
  placeholder = "Palabra (opcional)",
}: WordInputProps) {
  return (
    <input
      type="text"
      inputMode="text"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl bg-paper-2 text-h3 text-ink placeholder:text-ink-2/50 outline-none focus:ring-2 focus:ring-accent/40 tracking-widest"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
}
