"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { X, ChevronDown, ChevronUp, MapPin, Calendar } from "lucide-react";
import { PhotoPicker } from "@/src/components/ui/PhotoPicker";
import { PlacePicker, type SavedPlace } from "@/src/components/ui/PlacePicker";
import { readExif } from "@/src/lib/images/exif";
import { uploadMedia } from "@/src/lib/images/upload";
import { createClient } from "@/src/lib/supabase/client";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Kind = "cena" | "almuerzo" | "cine" | "plan_en_casa" | "evento" | "salida" | "otro";
type WouldReturn = "si" | "no" | "tal_vez";

const KIND_LABELS: Record<Kind, string> = {
  cena: "Cena",
  almuerzo: "Almuerzo",
  cine: "Cine",
  plan_en_casa: "En casa",
  evento: "Evento",
  salida: "Salida",
  otro: "Otro",
};

const WOULD_RETURN_LABELS: Record<WouldReturn, string> = {
  si: "Sí",
  no: "No",
  tal_vez: "Tal vez",
};

// ─── componente ──────────────────────────────────────────────────────────────

export default function NuevoDatePage() {
  const router = useRouter();

  // foto
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // lugar
  const [place, setPlace] = useState<SavedPlace | null>(null);

  // fecha
  const [dateStr, setDateStr] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dateFromExif, setDateFromExif] = useState(false);

  // acordeón
  const [open, setOpen] = useState(false);
  const [food, setFood] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [wouldReturn, setWouldReturn] = useState<WouldReturn | null>(null);
  const [note, setNote] = useState("");

  // estado de guardado y confirmación de descarte
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const canSave = !!file && !!place && !saving;

  // ── back ──────────────────────────────────────────────────────────────────

  function handleBack() {
    if (file) {
      setDiscardConfirm(true);
    } else {
      router.back();
    }
  }

  // ── foto ──────────────────────────────────────────────────────────────────

  async function handlePhotoChange(f: File) {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;
    setFile(f);
    setPreviewUrl(url);

    const exif = await readExif(f);
    if (exif.takenAt) {
      setDateStr(format(exif.takenAt, "yyyy-MM-dd"));
      setDateFromExif(true);
    } else {
      setDateFromExif(false);
    }
  }

  function handlePhotoClear() {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setDateFromExif(false);
  }

  // ── guardar ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!file || !place) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const media = await uploadMedia(file);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tenés que estar logueado.");
      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("No se encontró tu perfil.");
      const coupleId = profile.couple_id;

      const { data: entry, error: entryErr } = await supabase
        .from("entries")
        .insert({
          couple_id: coupleId,
          type: "date",
          occurred_on: dateStr,
          place_id: place.id,
          cover_media_id: media.mediaId,
        })
        .select("id, couple_id")
        .single();

      if (entryErr || !entry) {
        throw new Error(
          `No se pudo guardar el recuerdo. (${entryErr?.message ?? "sin detalle"})`,
        );
      }

      await supabase
        .from("media")
        .update({ entry_id: entry.id })
        .eq("id", media.mediaId);

      if (food || kind || wouldReturn || note) {
        await supabase.from("date_details").insert({
          entry_id: entry.id,
          couple_id: coupleId,
          food: food || null,
          kind: kind ?? null,
          would_return: wouldReturn ?? null,
        });
      }

      if (score !== null) {
        await supabase.from("date_ratings").insert({
          entry_id: entry.id,
          couple_id: coupleId,
          score,
        });
      }

      router.push(`/recuerdos?new=${entry.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col min-h-dvh bg-paper">
      {/* Header modo foco */}
      <header className="
        flex items-center justify-between shrink-0
        px-5 pt-[max(20px,env(safe-area-inset-top))] pb-3
        border-b border-line bg-paper
      ">
        <button
          onClick={handleBack}
          aria-label="Volver"
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-paper-2 transition-colors"
        >
          <X size={22} strokeWidth={1.75} className="text-ink" />
        </button>
        <span className="text-h3 text-ink">Nuevo date</span>
        <div className="w-10" />
      </header>

      {/* Confirmación de descarte */}
      {discardConfirm && (
        <div className="shrink-0 flex items-center gap-3 px-5 py-3 bg-accent-soft border-b border-line">
          <span className="text-small text-ink flex-1">¿Descartamos este date?</span>
          <button
            onClick={() => router.back()}
            className="text-small font-medium text-danger"
          >
            Descartar
          </button>
          <button
            onClick={() => setDiscardConfirm(false)}
            className="text-small font-medium text-ink"
          >
            Seguir
          </button>
        </div>
      )}

      {/* Área scrolleable */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-28 space-y-5">
        {/* Foto */}
        <section>
          <PhotoPicker
            previewUrl={previewUrl}
            onChange={handlePhotoChange}
            onClear={handlePhotoClear}
            disabled={saving}
          />
        </section>

        {/* Lugar */}
        <section>
          {place ? (
            <button
              onClick={() => setPlace(null)}
              className="
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                bg-surface border border-line text-left
              "
            >
              <MapPin size={16} className="text-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-body text-ink truncate">{place.name}</div>
                {place.city && (
                  <div className="text-small text-ink-2 truncate">{place.city}</div>
                )}
              </div>
              <span className="text-small text-ink-2 shrink-0">cambiar</span>
            </button>
          ) : (
            <PlacePicker onSelect={setPlace} nearLat={null} nearLng={null} />
          )}
        </section>

        {/* Fecha */}
        <section className="flex items-center gap-2">
          <Calendar size={16} className="text-ink-2 shrink-0" />
          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value);
              setDateFromExif(false);
            }}
            className="
              flex-1 py-2 px-3 rounded-xl bg-surface border border-line
              text-body text-ink focus:outline-none focus:border-accent
            "
          />
          {dateFromExif && (
            <span className="text-small text-ink-2 shrink-0">del EXIF</span>
          )}
        </section>

        {/* Acordeón opcional */}
        <section className="border border-line rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-body text-ink-2 hover:bg-surface transition-colors"
            aria-expanded={open}
          >
            <span>Agregar detalles (opcional)</span>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {open && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-line">
              <div>
                <label className="text-small text-ink-2 mb-1 block">¿Qué comieron?</label>
                <input
                  type="text"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  placeholder="Milanesa napolitana…"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-body text-ink placeholder:text-ink-2 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-small text-ink-2 mb-2 block">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setKind(kind === k ? null : k)}
                      className={`px-3 py-1.5 rounded-full text-small transition-colors ${
                        kind === k
                          ? "bg-accent text-paper"
                          : "bg-surface border border-line text-ink"
                      }`}
                    >
                      {KIND_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-small text-ink-2 mb-2 block">
                  Mi puntaje{score !== null ? ` — ${score}` : ""}
                </label>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(score === n ? null : n)}
                      className={`w-9 h-9 rounded-lg text-body font-medium transition-colors ${
                        score === n
                          ? "bg-accent text-paper"
                          : "bg-surface border border-line text-ink"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-small text-ink-2 mb-2 block">¿Volveríamos?</label>
                <div className="flex gap-2">
                  {(Object.keys(WOULD_RETURN_LABELS) as WouldReturn[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWouldReturn(wouldReturn === w ? null : w)}
                      className={`flex-1 py-2 rounded-lg text-body transition-colors ${
                        wouldReturn === w
                          ? "bg-accent text-paper"
                          : "bg-surface border border-line text-ink"
                      }`}
                    >
                      {WOULD_RETURN_LABELS[w]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-small text-ink-2 mb-1 block">Nota</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Algo para recordar…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-body text-ink placeholder:text-ink-2 resize-none focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-small">{error}</div>
        )}
      </div>

      {/* Guardar fijo abajo (no hay BottomNav en modo foco) */}
      <div className="
        fixed bottom-0 left-0 right-0 z-20
        bg-paper border-t border-line px-5
        pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]
      ">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-xl bg-accent text-paper text-ui font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </main>
  );
}
