import { BookImage } from "lucide-react";

export default function RecuerdosPage() {
  return (
    <main className="min-h-full bg-paper flex flex-col px-6 pt-6">
      <h1 className="text-h1 text-ink mb-8">Recuerdos</h1>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center pb-8">
        <BookImage size={48} strokeWidth={1.25} className="text-ink-2" />
        <p className="text-h3 text-ink">Todavía no hay nada.</p>
        <p className="text-small text-ink-2">Empecemos por la última salida.</p>
      </div>
    </main>
  );
}
