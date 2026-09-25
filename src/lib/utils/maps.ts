type MapTarget = { address: string; latitude?: number | null; longitude?: number | null; name?: string };

function query(target: MapTarget): string {
  if (target.latitude != null && target.longitude != null) return `${target.latitude},${target.longitude}`;
  return [target.name, target.address].filter(Boolean).join(", ");
}

/** Universal Google Maps search link — opens the native app on iOS and Android. */
export function mapsSearchUrl(target: MapTarget): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(target))}`;
}

/** Turn-by-turn directions from the guest's current location. */
export function mapsDirectionsUrl(target: MapTarget): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query(target))}`;
}
