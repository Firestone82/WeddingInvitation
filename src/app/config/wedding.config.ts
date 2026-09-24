/**
 * Everything guests see lives in this file.
 * Edit the values below (or translate them) and the whole invitation updates.
 */
import { WeddingConfig } from './wedding.model';
import { keepShortWordsAttached } from '../core/czech-typography';

const CONFIG: WeddingConfig = {
  locale: 'cs-CZ',
  timeZone: 'Europe/Prague',

  couple: {
    first: 'Tereza',
    second: 'Radek',
    initials: ['T', 'R'],
    photo: 'images/couple.svg',
    photoAlt: 'Tereza a Radek',
  },

  start: '2027-06-12T14:00:00+02:00',
  end: '2027-06-13T02:00:00+02:00',

  envelope: {
    recipient: 'Pro vás',
    // ?to= is inserted as written, so give the name in the 4th case: ?to=Janu%20a%20Petra → "Pro Janu a Petra"
    recipientPrefix: 'Pro',
    hintTouch: 'Otevřete klepnutím na pečeť',
    hintMouse: 'Otevřete kliknutím na pečeť',
    openLabel: 'Otevřít pozvánku',
  },

  hero: {
    lead: 'Společně s našimi rodinami vás srdečně zveme na naši svatbu',
    addToCalendar: 'Uložte si datum',
    calendarTitle: 'Svatba Terezy a Radka',
    googleCalendar: 'Google Kalendář',
    icsCalendar: 'Apple nebo Outlook',
    scrollHint: 'Pokračujte dolů k podrobnostem',
  },

  countdown: {
    heading: 'Do našeho „ano“ zbývá',
    done: 'Dnes je ten den.',
    units: {
      days: { one: 'den', few: 'dny', many: 'dne', other: 'dní' },
      hours: { one: 'hodina', few: 'hodiny', many: 'hodiny', other: 'hodin' },
      minutes: { one: 'minuta', few: 'minuty', many: 'minuty', other: 'minut' },
      seconds: { one: 'sekunda', few: 'sekundy', many: 'sekundy', other: 'sekund' },
    },
  },

  schedule: {
    heading: 'Program dne',
    items: [
      { time: '13:30', title: 'Příjezd hostů', description: 'Uvítací drink v zahradě.' },
      { time: '14:00', title: 'Obřad', description: 'Pod starou lípou.' },
      { time: '15:00', title: 'Gratulace a focení', description: 'Zůstaňte poblíž, chceme mít na fotce každého.' },
      { time: '17:30', title: 'Svatební hostina', description: 'V oranžérii vily.' },
      { time: '20:00', title: 'První tanec', description: 'Pak už parket patří vám.' },
      { time: '23:30', title: 'Půlnoční překvapení', description: 'Pro všechny, kdo ještě tančí.' },
    ],
  },

  venue: {
    heading: 'Kde',
    name: 'Vila Magnolia',
    address: 'Zahradní 12, 110 00 Praha 1',
    lat: 50.0755,
    lng: 14.4378,
    notes: [
      'Parkování zdarma přímo za vilou.',
      'Kyvadlový autobus jede z hlavního nádraží ve 12:45, zpátky v 1:00 a ve 2:30.',
    ],
    links: [],
    mapTitle: 'Mapa s polohou Vily Magnolia',
  },

  dressCode: {
    heading: 'Co si obléct',
    style: 'Slavnostně, ale do zahrady',
    description:
      'Letní obleky, midi nebo dlouhé šaty. Obřad bude na trávníku, takže se hodí boty na širším podpatku.',
    palette: [
      { name: 'Šalvějová', hex: '#9BAA93' },
      { name: 'Pudrově růžová', hex: '#C99A94' },
      { name: 'Šampaňská', hex: '#E5D3B3' },
      { name: 'Olivová', hex: '#6B7250' },
      { name: 'Vínová', hex: '#6E2632' },
    ],
    note: 'Bílou a smetanovou prosím nechte nevěstě.',
  },

  menu: {
    heading: 'Menu',
    courses: [
      { course: 'Předkrm', dish: 'Carpaccio z červené řepy', description: 'kozí sýr, vlašské ořechy, med' },
      { course: 'Polévka', dish: 'Hovězí vývar', description: 'játrové knedlíčky, kořenová zelenina' },
      { course: 'Hlavní chod', dish: 'Pečená kachna', description: 'červené zelí, houskový a bramborový knedlík' },
      { course: 'Vegetariánský hlavní chod', dish: 'Rizoto z lesních hub', description: 'parmazán, tymián, hnědé máslo' },
      { course: 'Dezert', dish: 'Svatební dort', description: 'vanilka, maliny, mascarpone' },
    ],
    note: 'Alergie a omezení ve stravování nám prosím napište do odpovědi.',
  },

  details: {
    heading: 'Dobré vědět',
    items: [
      {
        question: 'Můžu vzít doprovod?',
        answer: 'Na pozvánce jsou všichni, pro které máme připravené místo. Kdyby něco nebylo jasné, napište nám.',
      },
      {
        question: 'Můžeme vzít děti?',
        answer: 'Určitě. Připravíme dětský koutek s hračkami a od 18:00 i hlídání.',
      },
      {
        question: 'Co nám darovat?',
        answer: 'Největší dar je, že přijdete. Pokud nám přesto chcete něco dát, moc nás potěší příspěvek na svatební cestu.',
      },
      {
        question: 'Kde můžu přespat?',
        answer: 'Ve vile máme do 1. května zarezervované pokoje. Při rezervaci uveďte naše jména.',
      },
    ],
  },

  rsvp: {
    heading: 'Budete s námi?',
    intro: 'Dejte nám prosím vědět, ať můžeme naplánovat místa i jídlo.',
    deadline: '2027-05-01',
    deadlineLabel: 'Odpovězte prosím do',
    endpoint: null,
    email: 'tereza.radek@example.com',
    labels: {
      name: 'Vaše jméno',
      attending: 'Přijdete?',
      accept: 'Ano, přijdu',
      decline: 'Bohužel nemůžu',
      guests: 'Kolik vás přijde?',
      diet: 'Alergie nebo omezení ve stravování',
      dietPlaceholder: 'Vegetarián, bez lepku, alergie na ořechy…',
      message: 'Vzkaz pro nás',
      submit: 'Odeslat odpověď',
      sending: 'Odesílám odpověď…',
      sent: 'Odpověď odeslána',
      sentBody: 'Děkujeme. Moc se na vás těšíme.',
      mailOpened: 'Skoro hotovo',
      mailOpenedBody: 'Otevřel se vám e-mail s vyplněnou odpovědí. Dokončete ho tlačítkem Odeslat.',
      decrease: 'O jednoho méně',
      increase: 'O jednoho více',
      error: 'Odpověď se nepodařilo odeslat. Zkontrolujte připojení a zkuste to znovu, nebo nám napište e-mail.',
      nameRequired: 'Vyplňte prosím jméno, ať víme, kdo odpovídá.',
      attendingRequired: 'Vyberte prosím, jestli přijdete.',
      mailSubject: 'Odpověď na svatební pozvánku',
    },
    maxGuests: 4,
  },

  footer: {
    line: 'Těšíme se, až to spolu oslavíme.',
  },

  music: null,
};

export const WEDDING: WeddingConfig = CONFIG.locale.startsWith('cs') ? keepShortWordsAttached(CONFIG) : CONFIG;
