"use client";

import { useRef } from "react";
import { Camera, Images, X } from "lucide-react";

interface PhotoPickerProps {
  /** URL de preview (object URL) o null */
  previewUrl: string | null;
  onChange: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Dos botones (DESIGN §7): "Sacar foto" y "Elegir de la galería".
 * Si ya hay preview, muestra la imagen con botón de quitar.
 */
export function PhotoPicker({
  previewUrl,
  onChange,
  onClear,
  disabled = false,
}: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onChange(file);
    e.target.value = "";
  }

  if (previewUrl) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Foto seleccionada"
          className="w-full object-cover max-h-72"
        />
        <button
          onClick={onClear}
          disabled={disabled}
          aria-label="Quitar foto"
          className="
            absolute top-2 right-2
            w-8 h-8 rounded-full bg-ink/60 text-paper
            flex items-center justify-center
            active:scale-90 transition-transform
          "
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
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
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={disabled}
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
          disabled={disabled}
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
    </>
  );
}
