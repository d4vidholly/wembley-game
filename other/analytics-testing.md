# Analytics Testing Notes

Supabase analytics added 2026-06-06. Events land in `game_events` table.

## What we're testing for

### Primary questions
1. **Where do users drop off?** — `drop_off` events capture stage (`team_select`, `hero_select`, `match_in_progress`, `result_screen`) and time spent. Key question: are users reaching a match at all, or bouncing at team selection?
2. **Are Cup Heroes being discovered?** — `cup_hero_selected` fires per hero pick. `match_start.cup_heroes_selected` shows how many heroes were selected going into each match. Compare against matches with empty hero arrays to see adoption rate.
3. **Heroes vs Stars** — `cup_heroes_selected` has `home` and `away` arrays. Populated = heroes mode; empty = stars mode or no selection. Track which is more popular.

### Secondary questions
4. **Penalty engagement** — `penalty_shootout_completed.full_engagement` (true if player stayed within 60s of starting). Are users watching the whole shootout?
5. **Return visitors** — `session_start.is_return_visitor`. Is the game bringing people back?
6. **Device split** — `device_type` on every event. Informs mobile UI priority.
7. **Skin usage** — `skin_changed` events. Are users finding and switching skins?

## Events reference

| Event | Fires when |
|---|---|
| `session_start` | Page load (bots filtered) |
| `match_start` | Simulate button clicked |
| `match_completed` | Result shown (both normal and penalty paths) |
| `penalty_shootout_started` | Player clicks Start Penalties |
| `penalty_shootout_completed` | Shootout finishes |
| `cup_hero_selected` | Hero added to a team slot |
| `skin_changed` | User switches skin (not on load) |
| `drop_off` | Tab closed or hidden — captures current stage |

## Known noise to filter in queries
- All-star early data (2026-06-06) is test traffic — same visitor testing the build
- `duration_seconds` of 0–1 on `match_completed` is normal — the game resolves instantly
- **2026-06-10 ~20:00–22:00** — local dev testing, retro skin, match simulations. Record count went from ~410 to ~850, so roughly 440 rows are test noise. Filter by `data->>'skin' = 'retro'` and the timestamp window, or delete outright via SQL.
