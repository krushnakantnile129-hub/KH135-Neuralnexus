/**
 * Haversine Distance Formula
 * Calculates great-circle distance between two points on a sphere in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters to human readable distance string
 * e.g. 750 m or 1.2 km
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Generate Google Maps navigation deep-link
 */
export function getGoogleMapsUrl(lat: number, lng: number, storeName?: string): string {
  const query = storeName ? `&query=${encodeURIComponent(storeName)}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${query}`;
}

/**
 * Generate Apple Maps navigation deep-link
 */
export function getAppleMapsUrl(lat: number, lng: number, storeName?: string): string {
  const q = storeName ? `&q=${encodeURIComponent(storeName)}` : '';
  return `maps://?daddr=${lat},${lng}${q}`;
}

/**
 * Default Seed Locations for quick testing
 */
export const POPULAR_LOCATIONS = [
  { name: 'Pune Central (Shivajinagar / PRD Base)', lat: 18.5204, lng: 73.8567 },
  { name: 'Narhe, Pune', lat: 18.4485, lng: 73.8266 },
  { name: 'Alandi, Pune', lat: 18.6750, lng: 73.8986 },
  { name: 'Dadar West, Mumbai', lat: 19.0178, lng: 72.8478 },
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Koregaon Park, Pune', lat: 18.5362, lng: 73.8939 },
];
