/** Shape of the invitation content. The values live in wedding.config.ts. */

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface Course {
  course: string;
  dish: string;
  description?: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface MapLink {
  label: string;
  url: string;
}

export interface WeddingConfig {
  /** BCP 47 locale used for dates, times and plural rules, e.g. 'en-GB' or 'cs-CZ'. */
  locale: string;
  /** IANA time zone of the venue. Times are always shown in venue time, wherever the guest is. */
  timeZone: string;
  couple: {
    first: string;
    second: string;
    /** Two initials pressed into the wax seal. */
    initials: [string, string];
    photo: string;
    photoAlt: string;
  };
  /** ISO 8601 with offset so the countdown and calendar files are correct everywhere. */
  start: string;
  end: string;
  envelope: {
    /** Shown when the link has no ?to= parameter. */
    recipient: string;
    /** Prefix placed before ?to= value, e.g. "For" → "For Jana & Petr". */
    recipientPrefix: string;
    hintTouch: string;
    hintMouse: string;
    openLabel: string;
  };
  hero: {
    lead: string;
    addToCalendar: string;
    /** Title of the event saved to Google / Apple / Outlook calendars. */
    calendarTitle: string;
    googleCalendar: string;
    icsCalendar: string;
    /** Shown at the bottom of the first screen until the guest scrolls. */
    scrollHint: string;
  };
  countdown: {
    heading: string;
    done: string;
    units: { days: PluralForms; hours: PluralForms; minutes: PluralForms; seconds: PluralForms };
  };
  schedule: { heading: string; items: ScheduleItem[] };
  venue: {
    heading: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    notes: string[];
    /** Leave empty to generate Google Maps, Mapy.com and Waze links from lat/lng. */
    links: MapLink[];
    mapTitle: string;
  };
  dressCode: {
    heading: string;
    style: string;
    description: string;
    palette: Swatch[];
    note: string;
  };
  menu: {
    heading: string;
    courses: Course[];
    note: string;
  };
  details: { heading: string; items: Faq[] };
  rsvp: {
    heading: string;
    intro: string;
    /** ISO date shown as the reply deadline. */
    deadline: string;
    deadlineLabel: string;
    /**
     * POST endpoint that accepts JSON (Formspree, Getform, your own API…).
     * Leave null to open the guest's mail app with the reply pre-filled instead.
     */
    endpoint: string | null;
    email: string;
    labels: {
      name: string;
      attending: string;
      accept: string;
      decline: string;
      guests: string;
      diet: string;
      dietPlaceholder: string;
      message: string;
      submit: string;
      sending: string;
      sent: string;
      sentBody: string;
      mailOpened: string;
      mailOpenedBody: string;
      decrease: string;
      increase: string;
      error: string;
      nameRequired: string;
      attendingRequired: string;
      mailSubject: string;
    };
    maxGuests: number;
  };
  footer: { line: string };
  /** Optional background song that starts when the envelope opens. Put the file in /public. */
  music: { src: string; label: string } | null;
}
