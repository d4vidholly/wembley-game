# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based companion for the classic Wembley board game. Players simulate FA Cup matches, select Cup Heroes, and track earnings. Deployed as a static site at `https://www.wembleygame.live/`.

There is no build step, no framework, no package manager. The project is three files: `index.html`, `script.js`, `styles.css`.

## Running locally

Open `index.html` directly in a browser, or use any static file server:

```
npx serve .
```

Team and hero data is fetched at runtime from two Google Sheets published as CSV. The URLs are constants at the top of `script.js`. Session storage caches them for `CACHE_TTL_MS` (15 minutes) within a tab session.

## Architecture

**Data flow:**  
`fetchTeams()` + `fetchHeroes()` fire in parallel on page load → parse CSV → populate dropdowns → `initUI()`. All state lives in module-level `let` variables (`teams`, `heroes`, `selectedHeroesHome`, `selectedHeroesAway`, `heroesUnlocked`).

**Match simulation pipeline:**  
`simulateMatch()` → `rollGoals()` (weighted random from `goalChancesByStars`) → `applyHeroBonuses()` (two-phase: defensive heroes first, then offensive — so defensive reduction can't cancel an offensive addition) → determine winner → `calculatePrizeMoney()` + `calculateRoundBonus()` → render match report modal.

**Hero system:**  
Heroes are keyed by `id` string (e.g. `'haaland'`). GK/DEF heroes reduce the opposition's goals; MID/STR heroes add to their own team's goals. Wembley rounds (Semi Final, Final) use `secondary_chance` instead of `primary_chance` when `secondary_chance > primary_chance` — this is the "Wembley boost" pattern (Cole, Drogba). Beasant has additional logic: his Wembley boost only fires when the opponent is a higher-division team. Haaland's secondary roll only fires if he scored and the opponent is lower-division. Gerrard's secondary only fires after scoring if the team is still losing by exactly 1.

Hero cards from the sheet have `primary_text1`, `primary_text2`, and `secondary_text1` flavour strings used in the match report narrative. The `available` field in the heroes sheet locks a card (`available: N`), but cards are unlocked globally when `heroesUnlocked = true` (see Supporter unlock below).

**Penalty shootout:**  
Triggered when a knockout round or replay ends in a draw. `computePenaltyResults()` pre-calculates all kicks (winner always scores 5; loser has 75% per kick, must miss the 5th if they scored the first 4), then `animateKicks()` renders them sequentially using `setTimeout` chains, with early-termination logic when a team can no longer win.

**Theming:**  
CSS design tokens in `:root`. The `data-theme` attribute on `<body>` switches skins. `setSkin()` in `script.js` handles it. "Retro" shows a "coming soon" modal. "Supporter" skin is password-gated (see below).

**Password unlock system:**  
`UNLOCK_HASH` at the top of `script.js` is a SHA-256 hash used in two places: (1) the Supporter skin modal, and (2) the hero unlock modal (`heroUnlockModal`). Both use `hashPassword()` (Web Crypto API). When the hero unlock succeeds, `heroesUnlocked = true` is set in module scope, making all `available: N` hero cards selectable.

## Google Sheets data sources

The two CSV URLs in `script.js`:
- `SHEET_CSV_URL` — teams data (name, badge, division, stars 1–3, stadium, gate revenue, location, color1, color2)
- `HEROES_CSV_URL` — heroes data (id, position, name, price, primary_chance, secondary_chance, primary_description, primary_text1, primary_text2, secondary_description, secondary_text1, available)

Setting `available` to `N` in the heroes sheet locks that hero card in the UI (bypassed by the hero unlock password).

## Key conventions

- Badge SVGs live in `badges/`, hero images in `heroes/` (PNG preferred, falls back to JPG, then initials).
- `parseCSVLine()` is an RFC 4180-compliant parser — use it for all CSV parsing, don't replace it with `.split(',')`.
- Money strings are parsed with `parseMoney()` which strips non-numeric characters. Always use this instead of ad-hoc parsing. Money is formatted with `formatMoney()` using the `CURRENCY` constant (`'£'`).
- Stars are stored as `'★★★'` strings and parsed back to integers with `parseStars()`.
- All modal show/hide is done by toggling the `.hidden` class (which uses `display: none !important`).
- The replay flow swaps `selectedHeroesHome` / `selectedHeroesAway` so heroes follow their teams to the replay venue.
- `isWembley(round)` returns true for `'Semi Final'` and `'Final'` — use this helper rather than string comparisons throughout.
- `POSITION_COLORS` maps position strings to hex colours for hero card rendering.

## Spec files

`other/cup-heroes-spec.md` and `other/penalty-shootout-spec.md` document the original implementation specs for those features. `other/Hero Secondary Bonuses - Design Brief.md` documents planned secondary bonus triggers for heroes not yet implemented (Schmeichel, Seaman, Ward, Virgil, De Bruyne, Watson, Giggs, Vardy, Cech) — these are the roadmap, not the current code.
