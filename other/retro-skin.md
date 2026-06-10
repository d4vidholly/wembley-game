# Retro Skin

## How it works

Activating the retro skin swaps the team list from the standard sheet to a separate retro sheet. Deactivating swaps back. Each has its own session cache key so they don't collide.

`setSkin()` handles the swap by comparing the previous skin to the new one and calling `fetchTeams(url, cacheKey)` accordingly. It also swaps the round dropdown options and updates position labels on skin change.

## Sheet URL

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vRTGB1OfJePy6DYOdI1knPS25hFe58kp4CSN5OYZqzCJWs96XV5MJZxaLj_WV4oTiZj7y0DCltjPlIM/pub?gid=0&single=true&output=csv
```

Same column structure as the standard teams sheet: `name, badge, division, stars, stadium, gate, location, color1, color2`

Use "1st Division" / "2nd Division" / "3rd Division" as the `division` values in the sheet.

## Badge fallback

Retro teams have no badge SVGs yet. When the `badge` column is empty, `colorCircleSVG(color1, color2)` generates an inline SVG data URL:
- Outer circle = `color1` (r=50)
- Inner circle = `color2` (r=30) — omitted if color2 is blank
- Color values are sanitised: bare hex strings (e.g. `D00027`) get a `#` prefix added automatically

## Rule changes (vs Classic/Sky)

- **Rounds renamed:** Round of 32 → 3rd Round, Round of 16 → 4th Round, Quarter Final → 5th Round
- **Draw gate:** flat £3,000 split 50/50 (non-fixed-venue rounds only)
- **Round bonuses:** 5th Round = £1k/2k/3k (3★/2★/1★), Semi Final = £2k/4k/6k; no bonus for 3rd/4th Round
- **Semi Final venue:** Villa Park (gate £15,000); Final stays at Wembley (gate £30,000)
- **Position labels:** GK, IF (was DEF), OF (was MID), CF (was STR); DEF/MID colours swapped

## Cup Heroes

Generic heroes added for each position (GK/IF/OF/CF) — no secondary bonus. Code handles `secondary_chance = 0` correctly; no secondary rolls fire and no secondary text is shown.

## Visual design — current: "Edwardian Gazette" (Concept B)

Implemented via `[data-theme="retro"]` CSS block in styles.css:
- Palette: parchment `#e9d9b8` / `#f1e4c8`, ink `#4a3a26`, oxblood `#7b2a22`, brass `#b08d57`
- Typography: Crimson Text (body), Cinzel (score, round label, simulate button, hero card names, filter buttons)
- Texture: paper-grain SVG overlay at 18% opacity, multiply blend
- Header + footer: oxblood `#7b2a22`
- Team panels: corner-bracket `::before`/`::after` marks in oxblood; badge `filter: sepia(0.4)`
- Shadows: soft conventional (`0 2px 8px`) replacing hard pixel-offset

## UI details

- `.info-icon-box` (venue/prize/draw-rules boxes): no border, no shadow — flat `var(--accent-subtle)` fill only
- Empty hero slots (Int'l Stars circles + Cup Heroes squares): use same `var(--accent-subtle)` background so they visually match the info boxes

## Bug fixes

- **Penalty shootout buttons missing (all skins):** `replay` was referenced as a free variable in `finishShootout` but was only a local param of `simulateMatch`. The ReferenceError aborted `finishShootout` before buttons were restored. Fixed by threading `replay` through `startPenaltyShootout` → `animateKicks` → `finishShootout`.

## TODO

- Add real SVG badge files to `badges/` for retro teams; populate `badge` column in sheet to activate (circles disappear automatically)
