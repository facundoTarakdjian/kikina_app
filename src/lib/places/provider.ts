export interface PlaceResult {
  /** Identificador interno de Supabase (solo para lugares ya guardados) */
  supabaseId?: string;
  provider: "osm" | "manual";
  providerPlaceId: string | null;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

export type PlaceSearchFn = (
  query: string,
  lat: number | null,
  lng: number | null,
) => Promise<PlaceResult[]>;
