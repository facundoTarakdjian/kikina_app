"use client";

import { useRef, useState } from "react";
import { Camera, Images } from "lucide-react";
import { uploadMedia, type UploadResult } from "@/src/lib/images/upload";
import { createClient } from "@/src/lib/supabase/client";

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DevSubirPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setResult(null);
    setThumbUrl(null);
    setErrorMsg(null);

    try {
      const res = await uploadMedia(file);
      setResult(res);

      const supabase = createClient();
      const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(res.thumbPath, 300);
      setThumbUrl(signed?.signedUrl ?? null);

      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  const busy = status === "uploading";

  return (
    <main className="min-h-full bg-paper px-6 pt-8 pb-24">
      <h1 className="text-title text-ink mb-1">Dev — Subir foto</h1>
      <p className="text-small text-ink-2 mb-8">
        Esta página se borra en L-08. Solo para probar el pipeline.
      </p>

      {/* Inputs ocultos */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* PhotoPicker: dos botones grandes (DESIGN §7) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="
            flex flex-col items-center justify-center gap-2
            py-6 rounded-xl border-2 border-accent/40 bg-accent/5
            text-accent text-ui font-medium
            disabled:opacity-50 active:scale-95 transition-transform
          "
        >
          <Camera size={28} strokeWidth={1.75} />
          Sacar foto
        </button>

        <button
          onClick={() => galleryRef.current?.click()}
          disabled={busy}
          className="
            flex flex-col items-center justify-center gap-2
            py-6 rounded-xl border-2 border-ink-2/30 bg-surface
            text-ink text-ui font-medium
            disabled:opacity-50 active:scale-95 transition-transform
          "
        >
          <Images size={28} strokeWidth={1.75} />
          De la galería
        </button>
      </div>

      {busy && (
        <p className="mt-6 text-center text-small text-ink-2">Subiendo…</p>
      )}

      {status === "error" && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 text-small">
          {errorMsg}
        </div>
      )}

      {status === "done" && result && (
        <div className="mt-8 space-y-6">
          {thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt="Miniatura subida"
              className="w-full max-w-sm mx-auto rounded-xl object-cover"
            />
          )}

          <table className="w-full text-small text-ink border-collapse">
            <tbody>
              <Row label="ID" value={result.mediaId} mono />
              <Row label="Dimensiones" value={`${result.width} × ${result.height}`} />
              <Row label="Original" value={formatKB(result.originalBytes)} />
              <Row label="Main WebP" value={formatKB(result.compressedBytes)} />
              <Row label="Thumb WebP" value={formatKB(result.thumbBytes)} />
              <Row
                label="Taken at (EXIF)"
                value={result.takenAt ? result.takenAt.toLocaleString("es-AR") : "—"}
              />
              <Row
                label="GPS"
                value={
                  result.lat !== null && result.lng !== null
                    ? `${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`
                    : "—"
                }
              />
              <Row label="storage_path" value={result.storagePath} mono />
              <Row label="thumb_path" value={result.thumbPath} mono />
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-ink-3/20">
      <td className="py-2 pr-4 text-ink-2 w-32 shrink-0">{label}</td>
      <td className={`py-2 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</td>
    </tr>
  );
}
