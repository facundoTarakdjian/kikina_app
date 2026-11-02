import type { PlaceResult } from "./provider";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

export async function searchPhoton(
  query: string,
  lat: number | null,
  lng: number | null,
): Promise<PlaceResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    limit: "6",
    lang: "es",
  });
  if (lat !== null && lng !== null) {
    params.set("lat", lat.toFixed(6));
    params.set("lon", lng.toFixed(6));
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
  if (!res.ok) return [];

  const json = (await res.json()) as { features: PhotonFeature[] };

  return json.features.map((f): PlaceResult => {
    const p = f.properties;
    const [fLng, fLat] = f.geometry.coordinates;

    const addressParts = [p.street, p.housenumber].filter(Boolean).join(" ");
    const providerPlaceId =
      p.osm_type && p.osm_id != null
        ? `${p.osm_type}${p.osm_id}`
        : null;

    return {
      provider: "osm",
      providerPlaceId,
      name: p.name ?? query,
      address: addressParts || null,
      city: p.city ?? p.state ?? null,
      country: p.country ?? null,
      lat: fLat,
      lng: fLng,
    };
  });
}
