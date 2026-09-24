# Wedding invitation

Angular 22 + Tailwind CSS 4. Zoneless, standalone components, signals.

```bash
npm install
npm start            # http://localhost:4200
npm run build        # static site in dist/wedding-invitation/browser
```

Test on your phone over Wi-Fi with `npx ng serve --host 0.0.0.0` and open `http://<your-pc-ip>:4200`.

## Make it yours

Almost everything is in **`src/app/config/wedding.config.ts`**: names, date, venue, schedule, dress code, menu, questions, reply form and every button label.

- **Language**: the invitation is in Czech (`locale: 'cs-CZ'`). Dates, times and plural forms (den / dny / dní) come from the locale. Every text in the config automatically keeps one-letter words (v, s, k, a, i…) attached to the next word, as Czech typography requires. To switch languages, translate the strings, change `locale`, and update `lang`, `<title>` and the meta tags in `src/index.html`.
- **Time zone**: `timeZone` is the venue's. Times always show in venue time, even for guests abroad.
- **Photo**: put your picture in `public/images/` and change `couple.photo`. Portrait 3:4 works best; the arch crops the top corners.
- **Link preview image**: add `public/images/share.jpg` (1200×630) for WhatsApp/Messenger previews, or remove the `og:image` tag.
- **Colours and fonts**: tokens are in the `@theme` block of `src/styles.css`. Envelope colours are at the top of `src/app/envelope/envelope.css`.
- **Names font**: Pinyon Script (`--font-script`), self-hosted from `@fontsource/pinyon-script`. To try another, `npm i @fontsource/<name>`, swap the `@import` at the top of `styles.css` and change `--font-script`. Good alternatives with full Czech support: Mea Culpa (more flourished), Petit Formal Script (easier to read), Imperial Script.

## Personal links

Add `?to=` to the link and the envelope is addressed to that guest:

```
https://your-site.cz/?to=Janu%20a%20Petra
```

The value is inserted after "Pro" exactly as written, so give the names in the 4th case: `?to=Janu%20a%20Petra` → "Pro Janu a Petra", `?to=rodinu%20Novákovu` → "Pro rodinu Novákovu". Without `?to=` the envelope says "Pro vás". The value is also sent with the reply, so you know which invitation answered.

## Replies (RSVP)

- `rsvp.endpoint: null` (default): "Send reply" opens the guest's email app with the answer filled in, addressed to `rsvp.email`.
- `rsvp.endpoint: 'https://formspree.io/f/xxxx'`: replies are POSTed as JSON and collected for you. Any service or API that accepts JSON works.

## Music

Put an mp3 in `public/audio/` and set:

```ts
music: { src: 'audio/our-song.mp3', label: 'Play or pause music' },
```

It starts when the envelope is opened (browsers only allow sound after a tap) and a small toggle appears in the corner.

## The intro

- **Arrival**: the envelope drops in, the seal is stamped, the address writes itself. It waits for the fonts first, so the handwriting never flashes in a fallback font.
- **Idle**: leaf shadows sway, gold dust drifts, and the envelope tilts towards the mouse. On Android it follows the gyroscope; on iPhone (which needs a permission prompt) it sways on its own.
- **Opening**: the seal cracks and tumbles, then crumbs, sparks and a haptic tick on Android. The flap opens with shading, the letter slides out, and petals burst. The card grows to fill the screen, and the names fly to the page heading and hand over to it.
- **Tuning**: timings are the constants at the top of `envelope.ts`, mirrored in the timeline comment in `envelope.css`. Particle counts are in `open()`.
- **Fallback**: with "reduce motion" switched on, all of this becomes a quiet fade.

## Scroll cue

After the page appears, a cue at the bottom of the screen tells guests there is more below. The text is `hero.scrollHint` in the config. Tapping it scrolls down about one screen. If nobody has scrolled after a few seconds, the page lifts briefly to show more content (at most twice). The cue hides as soon as the guest scrolls and returns only at the very top. Timings are in `src/app/shared/scroll-cue/scroll-cue.ts`.

## Deploying

The build is a plain static site: Netlify, Vercel, Cloudflare Pages, GitHub Pages or any web host. If it doesn't live at the domain root, build with `npx ng build --base-href /your-path/`.

**GitHub Pages** is set up in `.github/workflows/deploy.yml`. Every push to `master` builds the site and publishes it; pull requests are only built, to check they compile. One-time setup: in the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**. The site then appears at `https://<user>.github.io/<repo>/`. The base href is set automatically, including for a custom domain. You can also start a deploy by hand from the **Actions** tab (**Deploy to GitHub Pages → Run workflow**).

## Where things are

Every component has its own folder with a `.ts`, `.html` and `.css` file.

```
src/app/
  app.ts / .html / .css          root: intro, page sections, footer, music toggle
  app.config.ts

  config/
    wedding.config.ts            all content (names, date, texts…)  ← edit this
    wedding.model.ts             types describing that content

  envelope/
    envelope.ts / .html / .css   intro: scene, envelope, seal, flap, card-to-page transition
    particles.ts                 canvas engine: gold dust, petals, sparks, wax crumbs
    leaves.ts                    generated leaf shadows for the dappled light

  sections/
    hero/          countdown/    schedule/     venue/
    dress-code/    menu/         details/      rsvp/
                                 (each: name.ts / name.html / name.css)

  shared/
    seal/          wax seal SVG with initials
    sprig/         botanical ornament that draws itself
    scroll-cue/    "Pokračujte dolů" cue and page nudge

  core/
    reveal.directive.ts            appReveal: reveal on scroll
    scroll-progress.directive.ts   appScrollProgress: --progress 0→1 while scrolling past
    intro-state.ts                 shared "envelope opened" signal
    dates.ts                       date/time formatting, plural forms
    calendar.ts                    Google Calendar link, .ics download
    maps.ts                        Google Maps / Mapy.com / Waze links
    browser.ts                     ?to= recipient, reduced-motion check
    czech-typography.ts            keeps one-letter words attached

src/styles.css                     Tailwind theme tokens, reveal variants, paper grain
```

Scroll reveals use `appReveal="rise | ink | unfold | arch | side | drop"`; each variant is defined in `styles.css`. Everything respects the system "reduce motion" setting.
