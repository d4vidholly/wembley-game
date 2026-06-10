# Retro Skin Redesign — "Edwardian Gazette" (Concept B)

The current `[data-theme="retro"]` skin (styles.css ~line 1652 onwards) is a Ceefax/BBC
Teletext concept (black background, navy panels, cyan/yellow/VT323 monospace). Replace
this entirely with a vintage matchday-programme look: light parchment background, papery
texture, traditional serif typography, sepia/oxblood palette.

A working HTML mockup of this concept (and two alternatives) was shared with the user —
this doc describes "Concept B" from that mockup in detail.

## 1. Palette

Replace the `[data-theme="retro"]` CSS variable block (styles.css ~line 1666):

```css
[data-theme="retro"] {
  --main-dark:     #4a3a26;   /* deep ink/sepia — was navy #000080 */
  --main-light:    #f1e4c8;   /* parchment panel — was lighter navy #0000AA */
  --text-colour:   #4a3a26;   /* was #ffffff */
  --border:        #8a6f4a;   /* sepia rule line — was cyan #00ffff */
  --accent:        #7b2a22;   /* oxblood — was yellow #ffff00 */
  --accent-subtle: rgba(123, 42, 34, 0.08);
  --accent-glow:   rgba(123, 42, 34, 0.25);
  --accent-gold:   #b08d57;   /* aged brass/gold — was orange #ff8800 */
  --overlay-bg:    rgba(74, 58, 38, 0.85);
}
```

Page/stage background: `#e9d9b8` (aged parchment), replacing `#000000`.

## 2. Typography

- Headings, masthead, score, hero/team names, button labels: **'Cinzel'** (Google Font),
  letterspaced, weight 500/700.
- Body text, labels, dropdowns, tooltips, descriptions: **'Crimson Text'** (Google Font),
  weight 400, with italics used for round names / subtler text.
- Remove the current rule that forces `'VT323', 'Courier New', monospace !important` on
  every element (styles.css ~line 1701-1706). Instead set:
  - `body[data-theme="retro"]` → `font-family: 'Crimson Text', serif;`
  - A new helper class (or attribute selector) for "display" elements (masthead title,
    round label, score, simulate button, hero card names) → `font-family: 'Cinzel', serif;`
- Both fonts need to be loaded — add to `index.html` `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:ital,wght@400;600;700&display=swap" rel="stylesheet">
  ```

## 3. Texture — paper grain

Remove the scanline overlay (`body[data-theme="retro"]::after`, styles.css ~1685-1698).
Replace with a subtle paper-grain overlay:

```css
body[data-theme="retro"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  opacity: 0.18;
  z-index: 9000;
}
```

## 4. Corners and shadows

- Drop the universal `border-radius: 0 !important` (styles.css ~1704) — Concept B uses
  mostly square panels but isn't as severe as Ceefax. A small radius (`2px`) is fine, or
  keep `0` if it reads cleaner with the corner-bracket marks below.
- Replace all the hard pixel-offset shadows (`box-shadow: Npx Npx 0 #colour`, used
  throughout for panels/buttons/modals) with either no shadow or a soft conventional
  shadow (e.g. `0 2px 8px rgba(74,58,38,0.15)`), consistent with a printed-paper look
  rather than a retro-game look.

## 5. Header / masthead

- `[data-theme="retro"] header` (~1709): parchment-light background (`#f1e4c8` or
  `var(--main-light)`), `border-bottom: 1px solid var(--border)` instead of the cyan
  3px border + glow shadow.
- **Remove** the `header::before` Ceefax page-number bar entirely (~1716-1732, the
  `'BBB CEEFAX 302 FA CUP RESULTS'` content block).
- Site title ("Wembley") rendered in Cinzel, bold, letterspaced (~6px), centered, with a
  small uppercase kicker label above it (e.g. "The Cup") in oxblood, small caps,
  letterspacing ~5px — see mockup for exact look.
- Optional: a small flourish divider under the title — a 1px horizontal line
  (`var(--border)`) ~120px wide, centered, with a small diamond/lozenge character (e.g.
  `\2756`) overlaid at its midpoint in oxblood on the page background colour.

## 6. Team panels

`[data-theme="retro"] .team-panel` (~1751):
- Background `var(--main-light)` (`#f1e4c8`), `border: 1px solid var(--border)`
  (`#8a6f4a`), no hard pixel shadow (or a soft shadow per §4).
- Add small "engraving" corner-bracket marks: two small L-shaped marks in oxblood, one
  at the top-left and one at the bottom-right corner of each panel, e.g.
  ```css
  [data-theme="retro"] .team-panel::before,
  [data-theme="retro"] .team-panel::after {
    content: '';
    position: absolute;
    width: 8px; height: 8px;
    border: 1px solid var(--accent);
  }
  [data-theme="retro"] .team-panel::before { top: 3px; left: 3px; border-right: none; border-bottom: none; }
  [data-theme="retro"] .team-panel::after  { bottom: 3px; right: 3px; border-left: none; border-top: none; }
  ```
  (`.team-panel` will need `position: relative` if it doesn't already have it.)
- `.team-panel img:not(.hero-slot-photo)` (badges): apply `filter: sepia(0.4)` instead of
  the cyan pixel-shadow, for an aged-photo feel.

## 7. Dropdowns, info box, buttons

- `.team-select`, `.round-dropdown` (~1762): parchment background, ink text
  (`var(--text-colour)`), Crimson Text font, normal-weight border in `var(--border)`.
- `.info-icon-box` (~1770): subtle oxblood tint background (`var(--accent-subtle)`),
  `1px solid var(--border)`, soft shadow per §4.
- `.simulate-btn` (~1777): background `var(--accent)` (oxblood `#7b2a22`), text
  `var(--main-light)` (parchment), Cinzel font, bold, letterspacing ~4-5px, uppercase,
  `1px solid var(--main-dark)` border, soft shadow. Hover: lighten oxblood slightly
  (e.g. `#9a3a30`) rather than swapping to cyan/yellow.

## 8. Modals

`.modal-content`, `.match-info-modal-content`, `.cup-heroes-modal-content`,
`.cup-heroes-info-modal-content`, `.cup-heroes-sticky-header` (~1797-1824): parchment
background (`var(--main-light)`), `1px solid var(--border)`, soft shadow per §4 instead
of `8px 8px 0 #006666`.

## 9. Match report

- `#reportScore` (~1827): Cinzel, large, ink/oxblood colour, drop the harsh
  `text-shadow: 3px 3px 0 #888800` — replace with a subtle shadow or none.
- `#reportRound` (~1834): Cinzel, small caps / letterspaced, `var(--accent)` (oxblood).
- `.report-button`, `#cupHeroesClose`, `.match-info-close` (~1841-1876): parchment
  background, `1px solid var(--border)`, Crimson Text, soft shadow. Hover: oxblood
  background with parchment text (mirrors current cyan/navy hover swap, just remapped to
  the new palette).

## 10. Hero cards & filter bar

- `.hero-card` (~1879): keep the position-coloured border (`var(--pos-color)` —
  remember DEF/MID colours are swapped per `other/retro-rule-changes.md` §6), but drop
  the hard pixel `box-shadow` for a soft shadow, and remove `filter: none` overrides tied
  to the old neon look if no longer needed.
- `.hero-card--selected` (~1890): border colour `var(--accent)` (oxblood) instead of
  yellow; soft shadow.
- `.hero-card-name`, `.hero-card-meta` (~1896-1904): parchment/ink instead of
  black-on-cyan; Crimson Text.
- `.filter-btn` / `.filter-btn.active` (~1913-1929): sepia border, ink text; active state
  = oxblood background with parchment text.

## 11. Penalty shootout, demo dots, banner

- `.pen-circle`, `.pen-circle--scored`, `.pen-circle--missed` (~1932-1951): parchment
  base, scored = `var(--accent-gold)` (brass) or oxblood, missed = dark ink
  (`var(--main-dark)`). Update `.pen-label--scored` / `.pen-label--missed` colours to
  match.
- `.demo-dot` / `.demo-dot.active` (~1986-1996): small sepia-bordered circles, active =
  oxblood fill. These can keep their square shape or pick up the `border-radius` decision
  from §4.
- `.banner` (~2009): parchment background, `border-top: 1px solid var(--border)`.

## Summary

Net effect: the Retro skin moves from a dark Ceefax/teletext aesthetic to a light,
papery "Edwardian Gazette" matchday-programme aesthetic — Cinzel display type, Crimson
Text body copy, sepia/oxblood/brass palette on aged parchment, subtle grain texture,
corner-bracket "engraving" details on panels, and soft conventional shadows in place of
the hard pixel-offset shadows.
