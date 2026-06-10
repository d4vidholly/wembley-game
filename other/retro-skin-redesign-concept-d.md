# Retro Skin Redesign — "Match Day Pocket Edition" (Concept D)

The current `[data-theme="retro"]` skin (styles.css ~line 1652 onwards) is a Ceefax/BBC
Teletext concept (black background, navy panels, cyan/yellow/VT323 monospace). Replace
this entirely with a vintage football-programme-book look: cream background, bold
poster-red display type, heavy black rules, halftone illustration touches — based on the
"Match Day: Football Programmes" book cover (Bob Stanley & Paul Kelly, FUEL).

This is an alternative to `other/retro-skin-redesign.md` (Edwardian Gazette, sepia,
Concept B) — implement **one or the other**, not both.

## 1. Palette

Replace the `[data-theme="retro"]` CSS variable block (styles.css ~line 1666):

```css
[data-theme="retro"] {
  --main-dark:     #1b1b1b;   /* ink black — was navy #000080 */
  --main-light:    #fbf4e6;   /* cream panel — was lighter navy #0000AA */
  --text-colour:   #1b1b1b;   /* was #ffffff */
  --border:        #1b1b1b;   /* bold black rule — was cyan #00ffff */
  --accent:        #d8261f;   /* poster red — was yellow #ffff00 */
  --accent-subtle: rgba(216, 38, 31, 0.08);
  --accent-glow:   rgba(216, 38, 31, 0.25);
  --accent-gold:   #d8261f;   /* reuse poster red — was orange #ff8800 */
  --overlay-bg:    rgba(27, 27, 27, 0.85);
}
```

Page/stage background: `#f1e6d2` (cream paper), replacing `#000000`.

## 2. Typography

Three fonts (all Google Fonts):

- **'Anton'** — heavy condensed display sans, used for the "WEMBLEY" masthead, match
  score, simulate button, and other big poster-style headlines. Always uppercase.
- **'Archivo Black'** — bold sans for labels: team names, round labels, hero card names,
  filter buttons, kickers. Always uppercase, letterspaced.
- **'PT Serif'** (italic variant) — for subtitles and secondary descriptive text (e.g.
  division names, tooltips, round descriptors), echoing the cover's
  "Post-war to Premiership" strapline.

Remove the rule that forces `'VT323', 'Courier New', monospace !important` on every
element (styles.css ~line 1701-1706). Instead:
- `body[data-theme="retro"]` → `font-family: 'PT Serif', serif;` (sensible serif fallback
  for any untouched text)
- Display elements (masthead title, `#reportScore`, `.simulate-btn`,
  `.hero-card-name`) → `font-family: 'Anton', sans-serif;`
- Label elements (team names, round label, filter buttons, kickers) →
  `font-family: 'Archivo Black', sans-serif;`
- Subtitle/description elements (division text, tooltips) → `font-family: 'PT Serif', serif; font-style: italic;`

Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=PT+Serif:ital,wght@0,400;1,400;1,700&display=swap" rel="stylesheet">
```

## 3. Texture — paper grain

Remove the scanline overlay (`body[data-theme="retro"]::after`, styles.css ~1685-1698).
Replace with the same subtle paper-grain overlay used in Concept B:

```css
body[data-theme="retro"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  opacity: 0.15;
  z-index: 9000;
}
```

## 4. Corners and shadows

- Keep `border-radius: 0 !important` (styles.css ~1704) — Concept D is a sharp-cornered,
  bold-rule poster aesthetic.
- Replace all hard pixel-offset shadows (`box-shadow: Npx Npx 0 #colour`) with **bold
  solid borders** instead of shadows where possible (e.g. `border: 3px solid var(--border)`),
  or drop shadows entirely. Where a shadow is kept (e.g. modals), use a soft conventional
  shadow: `0 2px 8px rgba(27,27,27,0.15)`.

## 5. Header / masthead

- `[data-theme="retro"] header` (~1709): cream background (`var(--main-light)` or page
  background), `border-bottom: 4px solid var(--border)` instead of the cyan 3px border +
  glow shadow.
- **Remove** the `header::before` Ceefax page-number bar entirely (~1716-1732, the
  `'BBB CEEFAX 302 FA CUP RESULTS'` content block).
- Site title ("Wembley") in **Anton**, large (~48-56px), poster red (`var(--accent)`),
  centered.
- Below it, a small italic **PT Serif** subtitle (e.g. "3rd Round to the Final") and an
  **Archivo Black** uppercase letterspaced kicker (e.g. "FA Cup Companion").
- Optional: a red starburst badge (CSS `clip-path` polygon, see §10) in the top-right
  corner of the header — a fun decorative nod to the book cover's "Pocket Edition"
  sticker. Could surface contextual info (e.g. current division, or "Cup Heroes
  unlocked") rather than being purely decorative.

## 6. Team panels

`[data-theme="retro"] .team-panel` (~1751):
- Background `var(--main-light)` (`#fbf4e6`), `border: 3px solid var(--border)`
  (`#1b1b1b`), no pixel shadow.
- If the two team panels sit side by side in `.match-area`, give them a shared `3px
  solid var(--border)` divider between them (e.g. `border-right` on the home panel)
  rather than independent shadows — mirrors the boxed two-column look in the mockup.
- `.team-panel img:not(.hero-slot-photo)` (badges): replace the cyan pixel-shadow with a
  `3px solid var(--border)` ring; optionally apply a halftone-dot background behind the
  badge using a repeating radial-gradient pattern:
  ```css
  background-image: radial-gradient(var(--border) 35%, transparent 36%);
  background-size: 8px 8px;
  ```
- Team name → Archivo Black, uppercase, letterspaced. Division text → PT Serif italic,
  poster red (`var(--accent)`).

## 7. Dropdowns, info box, buttons

- `.team-select`, `.round-dropdown` (~1762): cream background, ink text
  (`var(--text-colour)`), Archivo Black or PT Serif (pick one consistently — Archivo
  Black for short labels reads more "programme"), `1px solid var(--border)`.
- `.info-icon-box` (~1770): subtle red tint (`var(--accent-subtle)`),
  `2px solid var(--border)`, no pixel shadow.
- `.simulate-btn` (~1777): background `var(--main-dark)` (ink black), text
  `var(--main-light)` (cream), **Anton** font, large, letterspaced (~5px), uppercase,
  `3px solid var(--accent)` (poster red) border. Hover: swap to `var(--accent)` background
  with `var(--main-light)` text, border becomes `var(--main-dark)`.

## 8. Modals

`.modal-content`, `.match-info-modal-content`, `.cup-heroes-modal-content`,
`.cup-heroes-info-modal-content`, `.cup-heroes-sticky-header` (~1797-1824): cream
background (`var(--main-light)`), `3px solid var(--border)`, soft shadow
(`0 2px 8px rgba(27,27,27,0.15)`) instead of `8px 8px 0 #006666`.

## 9. Match report

- `#reportScore` (~1827): **Anton**, large, ink black or poster red, drop the harsh
  `text-shadow: 3px 3px 0 #888800` entirely (clean flat colour reads better with Anton).
- `#reportRound` (~1834): **Archivo Black**, uppercase, letterspaced, `var(--accent)`
  (poster red).
- `.report-button`, `#cupHeroesClose`, `.match-info-close` (~1841-1876): cream
  background, `2px solid var(--border)`, Archivo Black, no pixel shadow. Hover: ink
  black background with cream text (mirrors current cyan/navy hover swap, remapped to
  the new palette).

## 10. Starburst badge (new component)

A small reusable "sticker" element, echoing the "Pocket Edition" starburst on the cover.
Suggested CSS:

```css
[data-theme="retro"] .retro-starburst {
  width: 72px;
  height: 72px;
  background: var(--accent);
  color: var(--main-light);
  border-radius: 50%;
  clip-path: polygon(
    50% 0%, 61% 18%, 80% 8%, 82% 29%, 100% 31%, 90% 50%,
    100% 69%, 82% 71%, 80% 92%, 61% 82%, 50% 100%, 39% 82%,
    20% 92%, 18% 71%, 0% 69%, 10% 50%, 0% 31%, 18% 29%,
    20% 8%, 39% 18%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: 'Archivo Black', sans-serif;
  font-size: 9px;
  line-height: 1.2;
  text-transform: uppercase;
  transform: rotate(8deg);
}
```

Possible uses: highlighting the round bonus amount, flagging "Cup Heroes Unlocked", or a
decorative header element. Keep this optional/low-priority — implement the palette,
typography, and panel changes first, then add the starburst if there's a natural slot
for it.

## 11. Hero cards & filter bar

- `.hero-card` (~1879): keep the position-coloured border (`var(--pos-color)` —
  remember DEF/MID colours are swapped per `other/retro-rule-changes.md` §6), increase to
  `3px solid` to match the bold-rule aesthetic, drop the pixel `box-shadow`.
- `.hero-card--selected` (~1890): border colour `var(--accent)` (poster red) instead of
  yellow, no glow shadow.
- `.hero-card-name`, `.hero-card-meta` (~1896-1904): cream/ink instead of
  black-on-cyan; Archivo Black for names.
- `.filter-btn` / `.filter-btn.active` (~1913-1929): black border, ink text; active state
  = poster red background with cream text.

## 12. Penalty shootout, demo dots, banner

- `.pen-circle`, `.pen-circle--scored`, `.pen-circle--missed` (~1932-1951): cream base
  with black border; scored = `var(--accent)` (poster red), missed = ink black
  (`var(--main-dark)`). Update `.pen-label--scored` / `.pen-label--missed` colours to
  match.
- `.demo-dot` / `.demo-dot.active` (~1986-1996): small black-bordered squares (square fits
  the sharp-corner aesthetic better than circles), active = poster red fill.
- `.banner` (~2009): cream background, `border-top: 3px solid var(--border)`.

## Summary

Net effect: the Retro skin moves from a dark Ceefax/teletext aesthetic to a bold,
graphic "Match Day Pocket Edition" look — Anton display headlines in poster red, Archivo
Black labels, PT Serif italic subtitles, cream paper background with subtle grain, heavy
black rules in place of pixel shadows, halftone-dot badge treatment, and an optional red
starburst sticker as a decorative/callout element.
