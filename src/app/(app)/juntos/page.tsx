import { Users } from "lucide-react";

export default function JuntosPage() {
  return (
    <main className="min-h-full bg-paper flex flex-col px-6 pt-6">
      <h1 className="text-h1 text-ink mb-8">Juntos</h1>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center pb-8">
        <Users size={48} strokeWidth={1.25} className="text-ink-2" />
        <p className="text-h3 text-ink">El lugar de lo que hacen juntos.</p>
        <p className="text-small text-ink-2">
          Preguntas, Discreción y sobres.
        </p>
      </div>
    </main>
  );
}
