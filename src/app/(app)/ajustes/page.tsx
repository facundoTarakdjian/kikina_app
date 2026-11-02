import { SignOutButton } from "./SignOutButton";

export default function AjustesPage() {
  return (
    <main className="min-h-full bg-paper flex flex-col px-6 pt-6">
      <h1 className="text-h1 text-ink mb-8">Ajustes</h1>

      <div className="flex flex-col gap-2">
        <SignOutButton />
      </div>

      {/* Atribución de assets open source */}
      <footer className="mt-auto pt-8 pb-2">
        <p className="text-caption text-ink-2">
          Koala: Noto Emoji, © Google, Apache License 2.0
        </p>
      </footer>
    </main>
  );
}
