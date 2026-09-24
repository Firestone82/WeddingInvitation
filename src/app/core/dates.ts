import { PluralForms } from '../config/wedding.model';

export function pluralize(locale: string, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return forms[rule] ?? forms.other;
}

export function formatLongDate(locale: string, timeZone: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Czech weekdays are lowercase ("sobota"); capitalise when the date starts a line. */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

export function formatShortDate(locale: string, timeZone: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

export function formatTime(locale: string, timeZone: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
