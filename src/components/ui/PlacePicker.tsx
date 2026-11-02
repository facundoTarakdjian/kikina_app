"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { searchPhoton } from "@/src/lib/places/photon";
import type { PlaceResult } from "@/src/lib/places/provider";

interface PlacePickerProps {
  onSelect: (place: SavedPlace) => void;
  /** Fecha de la foto para ordenar lugares previos por cercanía */
  nearLat?: number | null;
  nearLng?: number | null;
}

/** Lugar ya persistido en Supabase (tiene id) */
export interface SavedPlace {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Section =
  | { kind: "prev"; items: SavedPlace[] }
  | { kind: "photon"; items: PlaceResult[] }
  | { kind: "manual"; query: string };

export function PlacePicker({ onSelect, nearLat, nearLng }: PlacePickerProps) {
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solicitar posición y couple_id al montar (en paralelo; no bloquean)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {/* sin permiso: ok */},
        { timeout: 5000 },
      );
    }
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();
      if (data) setCoupleId(data.couple_id);
    });
  }, []);

  const searchLat = userPos?.lat ?? nearLat ?? null;
  const searchLng = userPos?.lng ?? nearLng ?? null;

  // Buscar lugares ya usados (sin query) al montar
  useEffect(() => {
    void loadPrevious();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPrevious() {
    const supabase = createClient();
    const { data } = await supabase
      .from("places")
      .select("id, name, address, city, country, lat, lng")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data || data.length === 0) return;

    const sorted = [...data].sort((a, b) => {
      if (searchLat == null || searchLng == null) return 0;
      const da =
        a.lat != null && a.lng != null
          ? haversineKm(searchLat, searchLng, a.lat, a.lng)
          : 99999;
      const db =
        b.lat != null && b.lng != null
          ? haversineKm(searchLat, searchLng, b.lat, b.lng)
          : 99999;
      return da - db;
    });

    setSections([{ kind: "prev", items: sorted as SavedPlace[] }]);
  }

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      void loadPrevious();
      return;
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 350);
  }

  async function runSearch(q: string) {
    setLoading(true);
    try {
      // Lugares propios que coincidan
      const supabase = createClient();
      const { data: prevData } = await supabase
        .from("places")
        .select("id, name, address, city, country, lat, lng")
        .ilike("name", `%${q}%`)
        .limit(5);

      // Photon
      const photonResults = await searchPhoton(q, searchLat, searchLng);

      const next: Section[] = [];
      if (prevData && prevData.length > 0) {
        next.push({ kind: "prev", items: prevData as SavedPlace[] });
      }
      if (photonResults.length > 0) {
        next.push({ kind: "photon", items: photonResults });
      }
      next.push({ kind: "manual", query: q });
      setSections(next);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(result: PlaceResult | SavedPlace) {
    // Si ya tiene id de Supabase, lo devolvemos directo
    if ("id" in result) {
      onSelect(result as SavedPlace);
      return;
    }

    // Upsert en places
    const supabase = createClient();
    const r = result as PlaceResult;

    if (r.providerPlaceId) {
      // Intentar encontrar existente para esta pareja
      const { data: existing } = await supabase
        .from("places")
        .select("id, name, address, city, country, lat, lng")
        .eq("provider", r.provider)
        .eq("provider_place_id", r.providerPlaceId)
        .maybeSingle();

      if (existing) {
        onSelect(existing as SavedPlace);
        return;
      }
    }

    if (!coupleId) return;
    const { data: inserted } = await supabase
      .from("places")
      .insert({
        couple_id: coupleId,
        name: r.name,
        address: r.address ?? null,
        city: r.city ?? null,
        country: r.country ?? null,
        lat: r.lat ?? null,
        lng: r.lng ?? null,
        provider: r.provider,
        provider_place_id: r.providerPlaceId ?? null,
      })
      .select("id, name, address, city, country, lat, lng")
      .single();

    if (inserted) onSelect(inserted as SavedPlace);
  }

  async function handleManual(q: string) {
    if (!coupleId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("places")
      .insert({
        couple_id: coupleId,
        name: q.trim(),
        provider: "manual",
        provider_place_id: null,
      })
      .select("id, name, address, city, country, lat, lng")
      .single();

    if (data) onSelect(data as SavedPlace);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Input */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-ink-2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar lugar…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="
            w-full pl-9 pr-9 py-3 rounded-xl
            bg-surface border border-line
            text-body text-ink placeholder:text-ink-2
            focus:outline-none focus:border-accent
          "
        />
        {query && (
          <button
            onClick={() => handleQueryChange("")}
            className="absolute right-3 text-ink-2"
            aria-label="Limpiar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Resultados */}
      {(sections.length > 0 || loading) && (
        <ul
          className="mt-1 bg-card rounded-xl border border-line overflow-hidden divide-y divide-line"
          role="listbox"
          aria-label="Lugares"
        >
          {loading && (
            <li className="px-4 py-3 text-small text-ink-2">Buscando…</li>
          )}

          {!loading &&
            sections.map((section, si) => {
              if (section.kind === "manual") {
                return (
                  <li key="manual">
                    <button
                      onClick={() => handleManual(section.query)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper active:bg-paper transition-colors"
                      role="option" aria-selected={false}
                    >
                      <MapPin size={16} className="text-ink-2 shrink-0" />
                      <span className="text-body text-ink-2">
                        Usar{" "}
                        <span className="text-ink font-medium">
                          «{section.query}»
                        </span>{" "}
                        como nombre
                      </span>
                    </button>
                  </li>
                );
              }

              if (section.kind === "prev") {
                return section.items.map((place) => (
                  <li key={`prev-${place.id}-${si}`}>
                    <button
                      onClick={() => handleSelect(place)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-paper active:bg-paper transition-colors"
                      role="option" aria-selected={false}
                    >
                      <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-body text-ink truncate">{place.name}</div>
                        {(place.city || place.country) && (
                          <div className="text-small text-ink-2 truncate">
                            {[place.city, place.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ));
              }

              // photon
              return section.items.map((r, i) => (
                <li key={`photon-${i}-${si}`}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-paper active:bg-paper transition-colors"
                    role="option" aria-selected={false}
                  >
                    <MapPin size={16} className="text-ink-2 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-body text-ink truncate">{r.name}</div>
                      {(r.city || r.country) && (
                        <div className="text-small text-ink-2 truncate">
                          {[r.city, r.country].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ));
            })}
        </ul>
      )}
    </div>
  );
}
