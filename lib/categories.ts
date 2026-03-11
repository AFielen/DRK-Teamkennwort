export const CATEGORIES = [
  { id: 'wifi', labelDe: 'WiFi & Netzwerk', labelEn: 'WiFi & Network' },
  { id: 'building', labelDe: 'Gebäude & Räume', labelEn: 'Buildings & Rooms' },
  { id: 'system', labelDe: 'Systeme & Portale', labelEn: 'Systems & Portals' },
  { id: 'social', labelDe: 'Social Media', labelEn: 'Social Media' },
  { id: 'email', labelDe: 'E-Mail-Konten', labelEn: 'Email Accounts' },
  { id: 'vendor', labelDe: 'Dienstleister', labelEn: 'Vendors' },
  { id: 'other', labelDe: 'Sonstiges', labelEn: 'Other' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
