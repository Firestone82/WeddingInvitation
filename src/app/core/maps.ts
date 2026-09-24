import { MapLink } from '../config/wedding.model';

/** Navigation links built from the venue coordinates. */
export function defaultMapLinks(lat: number, lng: number): MapLink[] {
  return [
    { label: 'Google Maps', url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` },
    { label: 'Mapy.com', url: `https://mapy.com/fnc/v1/showmap?center=${lng},${lat}&zoom=16&marker=true` },
    { label: 'Waze', url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
  ];
}
