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

Team and hero data is fetched at runtime from two Google Sheets published as CSV. The URLs are constants at the top of `script.js`. Session storage is used to cache them within a tab session.

## Architecture

**Data flow:**  
`fetchTeams()` + `fetchHeroes()` fire in parallel on page load → parse CSV → populate dropdowns → `initUI()`. All state lives in module-level `let` variables (`teams`, `heroes`, `selectedHeroesHome`, `selectedHeroesAway`).

**Match simulation pipeline:**  
`simulateMatch()` → `rollGoals()` (weighted random from `goalChancesByStars`) → `applyHeroBonuses()` (mutates goals based on selected hero IDs) → determine winner → `calculatePrizeMoney()` + `calculateRoundBonus()` → render match report modal.

**Hero system:**  
Heroes are keyed by `id` string (e.g. `'haaland'`). GK/DEF heroes reduce the opposition's goals; MID/STR heroes add to their own team's goals. Wembley rounds (Semi Final, Final) use `secondary_chance` instead of `primary_chance` for certain heroes. Haaland has special logic: secondary roll only fires if he scored and the opponent is a lower-division team.

**Penalty shootout:**  
Triggered when a knockout round ends in a draw. `computePenaltyResults()` pre-calculates all kicks, then `animateKicks()` renders them sequentially using `setTimeout` chains, with early-termination logic when a team can no longer win.

**Theming:**  
CSS design tokens in `:root`. The `data-theme` attribute on `<body>` switches skins. `setSkin()` in `script.js` handles it. "Retro" and "Dark" skins show a "coming soon" modal.

## Google Sheets data sources

The two CSV URLs in `script.js`:
- `SHEET_CSV_URL` — teams data (name, badge, division, stars 1–3, stadium, gate revenue, location, color1, color2)
- `HEROES_CSV_URL` — heroes data (id, position, name, price, primary_chance, secondary_chance, primary_description, secondary_description, available)

Setting `available` to `N` in the heroes sheet locks that hero card in the UI.

## Key conventions

- Badge SVGs live in `badges/`, hero images in `heroes/` (PNG preferred, falls back to JPG, then initials).
- `parseCSVLine()` is an RFC 4180-compliant parser — use it for all CSV parsing, don't replace it with `.split(',')`.
- Money strings are parsed with `parseMoney()` which strips non-numeric characters. Always use this instead of ad-hoc parsing.
- Stars are stored as `'★★★'` strings and parsed back to integers with `parseStars()`.
- All modal show/hide is done by toggling the `.hidden` class (which uses `display: none !important`).
- The replay flow swaps `selectedHeroesHome` / `selectedHeroesAway` so heroes follow their teams to the replay venue.
