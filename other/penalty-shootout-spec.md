# Penalty Shootout — Implementation Spec

## Overview

When a match ends in a draw in a knockout round (Semi Final, Final, or any replay), replace the immediate penalty result text with an animated penalty shootout sequence inside the match report modal. The winner is pre-determined at the point of the draw — the shootout is a visual dramatisation of that pre-decided result. Once all kicks are taken, the normal Match Earnings section is revealed.

---

## 1. Where to Hook Into the Existing Code

In `simulateMatch()`, the current draw-in-knockout logic looks like this:

```js
if (knockoutRounds.includes(round) || replay) {
  const winner = Math.random() < 0.5 ? homeName : awayName;
  winnerKey = winner === homeName ? 'home' : 'away';
  resultText = ...
}
```

Keep the `winner` and `winnerKey` determination exactly as-is. What changes is what happens next. Instead of setting `resultText` to the final outcome and showing the modal normally, call a new function:

```js
startPenaltyShootout(homeName, awayName, winner, round);
return; // stop simulateMatch here — modal is shown inside startPenaltyShootout
```

The prize money, round bonus, TV bonus, and totaliser calculations that currently run after this block must still run before the `return`. Only the modal display and result text are deferred.

---

## 2. Pre-Computing the Penalty Sequence

Add a constant at the top of `script.js`:

```js
const PEN_KICK_DURATION_MS = 5000; // duration per kick in ms — easy to adjust for testing
```

Inside `startPenaltyShootout()`, compute all 10 kicks upfront before any animation begins, so the outcome is fixed:

```js
function computePenaltyResults(winner, homeName, awayName) {
  // winner is either homeName or awayName
  const loser = winner === homeName ? awayName : homeName;

  function generateLoserKicks() {
    const kicks = [];
    for (let i = 0; i < 4; i++) {
      kicks.push(Math.random() > 0.25); // true = scored (75%), false = missed (25%)
    }
    // If loser scored all 4, they must miss their 5th
    const allScored = kicks.every(k => k);
    kicks.push(!allScored ? Math.random() > 0.25 : false);
    return kicks;
  }

  const winnerKicks = [true, true, true, true, true]; // winner always scores all 5
  const loserKicks  = generateLoserKicks();

  // Return keyed by 'home' and 'away' for easy lookup
  return {
    home: winner === homeName ? winnerKicks : loserKicks,
    away: winner === awayName ? winnerKicks : loserKicks
  };
}
```

The sequence is then interleaved: Home kick 1, Away kick 1, Home kick 2, Away kick 2, ... up to Home kick 5, Away kick 5. Build this as an ordered array of `{ side: 'home'|'away', index: 0–4, scored: bool }` objects.

---

## 3. Modal — Initial Penalty State

When `startPenaltyShootout()` is called, show the match report modal with the score and team badges as normal, but with two differences:

**Hide the Match Earnings section.** The earnings rows (ticket, prize, TV, total) should have a wrapper with `id="matchEarningsSection"`. Set `display: none` on it at the start of the shootout. Reveal it after the last kick is animated.

**Replace the result text area** (`id="reportResult"`) with:
- The text "End of 90 minutes — Penalty Shoot Out"
- A button: `<button id="startPenButton" class="report-button">START PENALTY SHOOT OUT</button>`

**Add a penalty circles section** (`id="penaltyCirclesSection"`) inside the modal content, between the score and the earnings. It contains two columns — one for each team — each showing 5 circles stacked vertically:

```html
<div id="penaltyCirclesSection" class="penalty-circles-section hidden">
  <div class="pen-column" id="penColHome">
    <div class="pen-circle" id="pen-home-0"></div>
    <div class="pen-circle" id="pen-home-1"></div>
    <div class="pen-circle" id="pen-home-2"></div>
    <div class="pen-circle" id="pen-home-3"></div>
    <div class="pen-circle" id="pen-home-4"></div>
  </div>
  <div class="pen-column" id="penColAway">
    <div class="pen-circle" id="pen-away-0"></div>
    <div class="pen-circle" id="pen-away-1"></div>
    <div class="pen-circle" id="pen-away-2"></div>
    <div class="pen-circle" id="pen-away-3"></div>
    <div class="pen-circle" id="pen-away-4"></div>
  </div>
</div>
```

All 10 circles start in the default "greyed out" state and are all visible from the start. The `penaltyCirclesSection` is hidden until the Start button is clicked.

Place the HTML for `penaltyCirclesSection` directly in `index.html` inside the modal content div.

---

## 4. Starting the Shootout

When the user clicks `#startPenButton`:
- Hide the button
- Show `#penaltyCirclesSection` (remove `hidden` class)
- Begin animating through the kicks sequentially using the pre-computed sequence

---

## 5. Kick Animation Sequence

Animate kicks one at a time using a recursive async function with `setTimeout`. For each kick:

1. **Suspense phase (0 → PEN_KICK_DURATION_MS × 0.8):** Apply a pulsing CSS class (`pen-circle--active`) to the current circle. This class should animate the circle with a gentle scale pulse using a CSS keyframe animation.

2. **Reveal phase (at PEN_KICK_DURATION_MS × 0.8):** Remove `pen-circle--active`. Apply either `pen-circle--scored` (white fill) or `pen-circle--missed` (red fill) based on the pre-computed result.

3. **Wait for full duration:** After the reveal, wait the remaining 20% of `PEN_KICK_DURATION_MS` before moving to the next kick.

Pseudocode:
```js
async function animateKicks(sequence, index = 0) {
  if (index >= sequence.length) {
    finishShootout(winner, round);
    return;
  }

  const { side, kickIndex, scored } = sequence[index];
  const circle = document.getElementById(`pen-${side}-${kickIndex}`);

  circle.classList.add('pen-circle--active');

  setTimeout(() => {
    circle.classList.remove('pen-circle--active');
    circle.classList.add(scored ? 'pen-circle--scored' : 'pen-circle--missed');

    setTimeout(() => {
      animateKicks(sequence, index + 1);
    }, PEN_KICK_DURATION_MS * 0.2);

  }, PEN_KICK_DURATION_MS * 0.8);
}
```

---

## 6. Finishing the Shootout

After the last kick is animated, call `finishShootout(winner, round)`:

- Count goals: `homeGoals = results.home.filter(Boolean).length`, same for away.
- Update `#reportScore` to show the penalty score, e.g. "3 - 5 (pens)" where the numbers are the penalty goals, not the match score. Add a small label above it: "After Penalties".
- Set the final result text in `#reportResult`:
  - If `round === 'Final'`: `"${winner} win the FA Cup on penalties!"`
  - Otherwise: `"${winner} win on penalties and progress to the next round"`
- Reveal `#matchEarningsSection` (remove `hidden` / set `display: block`)
- Show the "NEW MATCH" and "REPLAY MATCH" buttons as normal

---

## 7. CSS

Add these styles to `styles.css`:

```css
/* Penalty shootout layout */
.penalty-circles-section {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 80px; /* matches existing .match-result gap */
  margin: 20px 0;
}

.pen-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* Default state — greyed out */
.pen-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #444;
  border: 2px solid #666;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Active — pulsing during suspense */
.pen-circle--active {
  border-color: #fff;
  animation: pen-pulse 0.6s ease-in-out infinite;
}

@keyframes pen-pulse {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.2); opacity: 0.7; }
}

/* Scored — white */
.pen-circle--scored {
  background-color: #ffffff;
  border-color: #ffffff;
}

/* Missed — red */
.pen-circle--missed {
  background-color: #cc2200;
  border-color: #cc2200;
}
```

---

## 8. HTML Changes

In `index.html`, inside the `#matchReportModal` `.modal-content` div:

1. Add `id="matchEarningsSection"` as a wrapper around the three earnings rows (ticket, prize, TV) and the total row. This is the element hidden during the shootout and revealed after.

2. Add the `penaltyCirclesSection` block (with all 10 circle divs) between the score row and the earnings section.

3. Add `id="startPenButton"` button inside the `#reportResult` area — or adjacent to it. This button is only shown when a shootout is triggered; in normal matches it never appears.

---

## 9. What NOT to Change

- The existing draw handling for non-knockout rounds (replay logic) — leave completely untouched.
- The prize money, round bonus, TV bonus, and totaliser calculations — these must still run as normal; only their display is deferred until after the shootout.
- The `showReplayButton()` function — leave untouched.
- The `closeModal()` function — penalty state (circle classes, visibility of sections) resets naturally when the modal is closed since `closeModal()` adds `.hidden` to the modal; just ensure `penaltyCirclesSection` is also reset to hidden and all circle classes are cleared when a new match starts. Add a `resetPenaltyUI()` helper called at the start of each `simulateMatch()`.

---

## 10. Files to Modify

- `script.js` — `startPenaltyShootout()`, `computePenaltyResults()`, `animateKicks()`, `finishShootout()`, `resetPenaltyUI()`, hook into `simulateMatch()`
- `index.html` — `matchEarningsSection` wrapper, `penaltyCirclesSection` block, `startPenButton`
- `styles.css` — penalty circle styles and keyframe animation
