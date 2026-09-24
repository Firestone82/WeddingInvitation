import { WeddingConfig } from '../config/wedding.model';

const toIcsStamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

function eventTitle(c: WeddingConfig) {
  return c.hero.calendarTitle;
}

/** "Tereza", "Radek" → "tereza-radek" (no diacritics, safe as a file name) */
function slug(...parts: string[]) {
  return parts
    .join('-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
}

export function googleCalendarUrl(c: WeddingConfig): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(c),
    dates: `${toIcsStamp(c.start)}/${toIcsStamp(c.end)}`,
    location: `${c.venue.name}, ${c.venue.address}`,
    details: window.location.origin + window.location.pathname,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function downloadIcs(c: WeddingConfig): void {
  const escape = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//wedding-invitation//EN',
    'BEGIN:VEVENT',
    `UID:${toIcsStamp(c.start)}-wedding@invitation`,
    `DTSTAMP:${toIcsStamp(new Date().toISOString())}`,
    `DTSTART:${toIcsStamp(c.start)}`,
    `DTEND:${toIcsStamp(c.end)}`,
    `SUMMARY:${escape(eventTitle(c))}`,
    `LOCATION:${escape(`${c.venue.name}, ${c.venue.address}`)}`,
    `GEO:${c.venue.lat};${c.venue.lng}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${slug(c.couple.first, c.couple.second)}.ics`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
