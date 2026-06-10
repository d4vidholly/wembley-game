# Retro Edition — Rule Changes

These changes apply only to the **Retro skin** (`document.body.dataset.theme === 'retro'`), set via `setSkin('retro')`. Classic, Sky, and Supporter skins are unaffected unless noted.

## 1. Round structure

Retro keeps the same number of rounds as Classic/Sky, just renamed:

| Classic/Sky | Retro |
|---|---|
| Round of 32 | 3rd Round |
| Round of 16 | 4th Round |
| Quarter Final | 5th Round |
| Semi Final | Semi Final |
| Final | Final |

This affects:
  - `roundData` (script.js ~line 20) — keys and any per-round config (`revenue`, `ifDraw`, `kickoff`, `stadium`).
  - The round `<select id="roundSelect">` options (index.html ~line 49-55).
  - `calculateRoundBonus()` (script.js ~line 540), which currently keys on `"Quarter Final"` and `"Semi Final"`.
  - Any other string comparisons against `"Quarter Final"`, `"Round of 32"`, `"Round of 16"` (search the codebase — several files reference these).

## 2. Gate money for a draw

- Currently (`calculatePrizeMoney`, script.js ~line 519): for non-Wembley rounds, `totalRevenue = teams[homeTeam].gate`, split 50/50 on a draw.
- **Retro:** if the match is drawn, the gate is a flat **£3,000** (not the home team's actual gate figure), still split 50/50 (£1,500 each).
- The replay continues to be treated as a neutral-ground fixture — the existing home/away swap for replays (which already swaps `selectedHeroesHome`/`selectedHeroesAway`) stays as-is. Only the **prize money figure** for the drawn match changes to the flat £3,000, not the venue-swap mechanic itself.
- Wins/losses (non-draw results) keep using `teams[homeTeam].gate` as today.

## 3. Round bonuses

`calculateRoundBonus()` currently uses star rating (3★/2★/1★) as the lookup key. Retro should use the same star-rating mapping, but with a "1st/2nd/3rd Division" framing and new values:

| Round | 1st Div (3★) | 2nd Div (2★) | 3rd Div (1★) |
|---|---|---|---|
| 5th Round (was "Quarter Final" — new bonus tier) | £1,000 | £2,000 | £3,000 |
| Semi Final | £2,000 | £4,000 | £6,000 |

4th Round (was "Round of 16") and 3rd Round (was "Round of 32") have **no bonus** in Retro — only 5th Round and Semi Final award a bonus.

Current values for reference (Classic/Sky):
```js
"Quarter Final": { 3: 2000, 2: 4000, 1: 6000 },
"Semi Final":    { 3: 4000, 2: 8000, 1: 12000 }
```

## 4. Semi Final venue and gate money

- **Semi Final is no longer played at Wembley** — it now takes place at **Villa Park** as standard (Retro only).
- `isWembley()` (script.js ~line 382) currently returns `true` for both `'Semi Final'` and `'Final'`. For Retro, Semi Final should no longer be treated as a Wembley fixture for stadium-display purposes — but it should presumably keep whatever "fixed gate revenue" / "no replay, penalties on draw" behavior currently comes from `isWembley()` (i.e. don't accidentally turn Semi Finals back into normal home-gate, replay-on-draw fixtures). Recommend introducing a separate concept (e.g. `isFixedVenue(round)` or a per-round `stadium` override) so the "fixed gate + no replay" logic and the "which stadium is displayed" logic can vary independently.
- `roundData['Semi Final'].stadium` → `"Villa Park"` (was `"Wembley"`).
- **Final remains at Wembley** (confirmed, unchanged).
- New gate figures (Retro):
  - Semi Final gate: **£15,000** (was `$30000`)
  - Final gate: **£30,000** (was `$75000`)

## 5. Division naming

- **"Premier League" → "1st Division"**, purely a Retro Google Sheet content change. The Retro teams sheet (`RETRO_SHEET_CSV_URL`, see `other/retro-skin.md`) should use "1st Division" / "2nd Division" / "3rd Division" as the `division` display values (matching the bonus table above), instead of "Premier League" / etc. No code changes needed — `division` is already a free-text field read straight from the sheet.

## 6. International Stars / Cup Heroes — position rename & colours (Retro)

Current `POSITION_COLORS` (script.js ~line 14):
```js
const POSITION_COLORS = { GK: '#B8413B', DEF: '#AAA54A', MID: '#31813C', STR: '#BBBCB9' };
```

Retro renames and recolours the four hero/International Star positions:

| Position key | Current label | Retro label | Colour change |
|---|---|---|---|
| `GK` | Goal Keeper | Goal Keeper | unchanged (`#B8413B`) |
| `DEF` | Defender | Inside Forward | → green (`#31813C`, currently MID's colour) |
| `MID` | Midfielder | Outside Forward | → gold (`#AAA54A`, currently DEF's colour) |
| `STR` | Striker | Centre Forward | unchanged (`#BBBCB9`) |

In other words: in Retro, **swap the existing DEF and MID hex values** from `POSITION_COLORS` (script.js ~line 14: `{ GK: '#B8413B', DEF: '#AAA54A', MID: '#31813C', STR: '#BBBCB9' }`) — no new colours need to be introduced.

- These labels/colours appear in: hero card rendering (`renderHeroCards`, script.js ~1083+), the position filter buttons, the formation slot UI (~line 1004 and ~1172), and the International Stars selector (`selectedStarsHome`/`selectedStarsAway`, used in `applyHeroBonuses` ~line 478).
- **Recommendation:** keep the underlying position keys (`GK`/`DEF`/`MID`/`STR`) unchanged internally, since `applyHeroBonuses` and hero data branch on these — only swap the **display label** and **colour** when the Retro skin is active (e.g. a `RETRO_POSITION_LABELS` / `RETRO_POSITION_COLORS` map, applied wherever `POSITION_COLORS` or position labels are rendered).
