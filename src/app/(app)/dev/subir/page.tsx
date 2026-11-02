"use client";

import { useRef, useState } from "react";
import { uploadMedia, type UploadResult } from "@/src/lib/images/upload";
import { createClient } from "@/src/lib/supabase/client";

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DevSubirPage() {
  const inputRef = useRef<HTMLInputElement>(null);
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

      // Signed URL para la miniatura
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

  return (
    <main className="min-h-full bg-paper px-6 pt-8 pb-24">
      <h1 className="text-title text-ink mb-1">Dev — Subir foto</h1>
      <p className="text-small text-ink-2 mb-8">
        Esta página se borra en L-08. Solo para probar el pipeline.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // reset para poder subir el mismo archivo dos veces
          e.target.value = "";
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="
          w-full py-4 rounded-xl bg-accent text-paper text-ui font-medium
          disabled:opacity-50 active:scale-95 transition-transform
        "
      >
        {status === "uploading" ? "Subiendo…" : "Elegir o sacar foto"}
      </button>

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
