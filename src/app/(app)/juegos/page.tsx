import { Gamepad2 } from "lucide-react";

export default function JuegosPage() {
  return (
    <main className="min-h-full bg-paper flex flex-col px-6 pt-6">
      <h1 className="text-h1 text-ink mb-8">Juegos</h1>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center pb-8">
        <Gamepad2 size={48} strokeWidth={1.25} className="text-ink-2" />
        <p className="text-h3 text-ink">Los anotadores llegan pronto.</p>
        <p className="text-small text-ink-2">
          Truco, Chinchón, Scrabble y más.
        </p>
      </div>
    </main>
  );
}
