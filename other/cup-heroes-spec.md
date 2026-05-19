# Cup Heroes — Implementation Spec

## Overview

Replace the existing "International Stars" checkbox system with a new "Cup Heroes" feature. Players select up to 3 hero cards per team (max 1 per position) via a full-screen modal. Each hero has a primary bonus that fires at 80% probability during simulation, and some have a secondary bonus triggered by specific match conditions. Prices are displayed on cards as flavour — no money is deducted.

---

## 1. Google Sheets — Second Tab

The existing spreadsheet already has a Sheet1 (teams data). Add a **second sheet tab** called `heroes`. The app will fetch both CSVs on page load.

The heroes sheet URL will use the same spreadsheet ID but with `gid=` pointing to the second tab. The second tab's CSV URL should be stored as a second constant in `script.js`:

```js
const HEROES_CSV_URL = 'PASTE_HEROES_TAB_CSV_URL_HERE';
```

**Heroes sheet columns (row 1 = headers):**

| id | position | name | price | primary_chance | secondary_chance | primary_description | secondary_description |
|----|----------|------|-------|---------------|-----------------|--------------------|-----------------------|
| cech | GK | Cech | 5000 | 80 | 90 | 80% chance to reduce opposition score by 1 | Increases to 90% chance at Wembley |
| schmeichel | GK | Schmeichel | 5000 | 80 | 80 | 80% chance to reduce opposition score by 1 | Coming soon |
| cole | DEF | Cole | 10000 | 80 | 90 | 80% chance to reduce opposition score by 1 | Increases to 90% chance at Wembley |
| virgil | DEF | Virgil | 10000 | 80 | 80 | 80% chance to reduce opposition score by 1 | Coming soon |
| gerrard | MID | Gerrard | 20000 | 80 | 80 | 80% chance to increase score by 1 | Coming soon |
| ronaldo | MID | Ronaldo | 20000 | 80 | 80 | 80% chance to increase score by 1 | Coming soon |
| drogba | STR | Drogba | 40000 | 80 | 90 | 80% chance to increase score by 1 | Increases to 90% chance at Wembley |
| haaland | STR | Haaland | 40000 | 80 | 50 | 80% chance to increase score by 1 | If facing a lower division team: 50% chance to score again |

Pre-populate this tab with the data above. The app reads `primary_chance` and `secondary_chance` as the numbers used in simulation. `primary_description` and `secondary_description` are display-only strings shown on the hero card.

---

## 2. Data Layer — Fetching Heroes

Add `fetchHeroes()` alongside the existing `fetchTeams()`. Both are called on page load in parallel:

```js
await Promise.all([fetchTeams(), fetchHeroes()]);
```

Parse the heroes CSV into an object keyed by `id`:

```js
let heroes = {};
// e.g. heroes['cech'] = { id, position, name, price, primary_chance, secondary_chance, primary_description, secondary_description }
```

`primary_chance` and `secondary_chance` should be stored as numbers (0–100).

---

## 3. App State

Add two arrays to track selected heroes per team:

```js
let selectedHeroesHome = []; // array of hero id strings, max 3
let selectedHeroesAway = []; // array of hero id strings, max 3
```

These reset to `[]` when the modal is closed with "New Match" (i.e. when `closeModal()` is called).

---

## 4. UI — Team Panel Changes

On each team panel (home and away), **replace** the existing `Key-Player-Toggle` / checkbox block with:

- A "⚡ Cup Heroes" button that opens the hero selection modal for that team
- A small summary area below the button that dynamically shows the selected heroes for that team — display each selected hero as a small badge showing their initials and position (e.g. "GK · Cech"). If no heroes selected, show nothing.

The summary updates in real time as the player selects/deselects heroes in the modal.

---

## 5. UI — Cup Heroes Modal

A full-screen backdrop modal (same backdrop/blur style as the existing match report modal). It is separate from the match report modal and should have `id="cupHeroesModal"`.

**Modal header:**
- Title: "Cup Heroes" with the team name (Home or Away) e.g. "Cup Heroes — Arsenal"
- Selected count indicator: "2 / 3 selected" — updates live as cards are tapped. Text turns amber when 3/3 is reached.
- Close/confirm button: "Save & Close" — closes the modal and updates the team panel summary.

**Position filter bar:**
A row of filter buttons: All · GK · DEF · MID · STR. Default is "All". Clicking a filter shows only heroes of that position. The active filter button is highlighted.

**Hero cards grid:**
A scrollable grid of hero cards (2 columns on mobile, 4 on desktop). Each card contains:

- A placeholder image area (square, rounded corners) — use a styled div with the hero's initials as a fallback since no images exist yet. Use a gradient background colour-coded by position: GK = amber, DEF = blue, MID = green, STR = red.
- Hero name (large)
- Position badge
- Price (e.g. "$5,000")
- Primary bonus description (from sheet)
- Secondary bonus description (from sheet) — styled differently, e.g. slightly dimmer, prefixed with a ⚡ icon

**Card states:**
- Default: normal border
- Selected: highlighted border (use the existing `--border` colour but brighter/thicker), with a checkmark overlay on the image
- Disabled: greyed out — a card is disabled when: (a) the player already has a hero in that position selected, or (b) the player has 3 heroes selected and this card isn't one of them

**Interaction:**
- Click/tap a card to select it. If already selected, click again to deselect.
- Selecting a card when 3 are already selected does nothing (card appears disabled).
- There is no separate confirm step — selection is live. "Save & Close" just closes the modal.

**One modal, two teams:**
Use a single modal element in the HTML. When opened, pass a `side` parameter ('home' or 'away') so the modal knows which team's heroes to read/write. The title updates accordingly.

---

## 6. Simulation Logic Changes

The existing `simulateMatch()` function calculates `homeGoals` and `awayGoals` before determining the result. Hero bonuses are applied **after** the base goals are rolled, in a new function `applyHeroBonuses(homeGoals, awayGoals, homeName, awayName, round)` that returns `{ homeGoals, awayGoals }`.

Within `applyHeroBonuses`, iterate over `selectedHeroesHome` and `selectedHeroesAway` and apply the relevant logic per hero `id`:

**GK and DEF heroes (cech, schmeichel, cole, virgil):**
These reduce the **opposition's** goal tally.
- Determine the effective chance: use `secondary_chance` if the round is "Semi Final" or "Final", otherwise use `primary_chance`. For schmeichel and virgil, `primary_chance` and `secondary_chance` are both 80, so this makes no difference until their secondary bonus is defined.
- Roll: `Math.random() * 100 < effectiveChance`
- If roll succeeds AND opposition goals > 0: subtract 1 from opposition goals.
- Opposition goals cannot go below 0.

**MID heroes (gerrard, ronaldo):**
These increase the **own team's** goal tally.
- Use `primary_chance` (no secondary condition yet for these two).
- Roll: `Math.random() * 100 < primary_chance`
- If roll succeeds: add 1 to own goals.

**STR hero — drogba:**
- Determine effective chance: `secondary_chance` (90) if round is "Semi Final" or "Final", otherwise `primary_chance` (80).
- Roll: if success, add 1 to own goals.

**STR hero — haaland:**
- Primary roll: `Math.random() * 100 < primary_chance` (80). If success, add 1 to own goals.
- Secondary roll (lower division bonus): check if the **opposition team's** star count (parsed from `teams[oppositionName].stars`) is strictly less than **Haaland's team's** star count. If so, roll `Math.random() * 100 < secondary_chance` (50). If that also succeeds, add 1 more to own goals.
- The secondary roll only happens if the primary roll succeeded.

**Note:** Heroes selected by the home team apply against the away team's goals, and vice versa. Be careful about which `goals` variable each hero modifies.

The result of `applyHeroBonuses` is used as `finalHomeGoals` and `finalAwayGoals` going into the result determination logic. Remove the old `calculateBonus()` function and the `homeBonus`/`awayBonus` variables that used it.

---

## 7. Match Report — Hero Bonus Narrative

In the match report modal, add a small section below the score that lists which heroes fired and what they did — e.g. "⚡ Cech reduced Arsenal's goals by 1" or "⚡ Haaland scored twice". This gives players feedback on what happened. Only show entries for heroes whose roll actually succeeded.

---

## 8. What Not to Change

- The teams data fetch, CSV parsing, and dropdown population logic — leave untouched.
- The `roundData`, `goalChancesByStars`, and `rollGoals` functions — leave untouched.
- The prize money, round bonus, and TV bonus calculations — leave untouched.
- The existing match report modal layout — only add the hero narrative section, don't restructure it.
- The styles for the existing team panels, match area, and report modal — only add new CSS, don't modify existing rules.
- The `closeModal()` function — keep as-is but add `selectedHeroesHome = []; selectedHeroesAway = [];` to reset hero state on new match.

---

## 9. CSS Notes

- The Cup Heroes modal should use the same `--main-dark`, `--main-light`, `--border`, and `--text-colour` CSS variables as the rest of the app.
- Position colour coding: GK = `#b8860b` (amber), DEF = `#1a3a6b` (dark blue), MID = `#1a5c2a` (dark green), STR = `#6b1a1a` (dark red).
- The filter bar and card grid should be fully responsive — 2-column grid on mobile, 4-column on desktop (breakpoint at 767px, matching the existing media query).
- Selected card border: `3px solid #4a9eff` with a subtle glow `box-shadow: 0 0 8px rgba(74, 158, 255, 0.5)`.
- Disabled card: `opacity: 0.4`, `pointer-events: none`.

---

## 10. Files to Modify

- `script.js` — all logic and data changes
- `index.html` — add the Cup Heroes modal element, update team panel buttons, remove old checkbox markup
- `styles.css` — add Cup Heroes modal and card styles

Do not create any new files other than changes to these three.
