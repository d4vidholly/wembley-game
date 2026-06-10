# Code Review Fixes

Apply the following fixes to `index.html`, `script.js`, and `styles.css`. There is no build step — edit the files directly.

---

## 1. `script.js` — Rewrite `parseHeroesCSV` to use header-indexed parsing

Replace the current `parseHeroesCSV` function with a header-indexed version that matches the pattern used in `parseTeamsCSV`. This makes it resilient to column reordering in Google Sheets.

```js
function parseHeroesCSV(csv) {
  const lines = csv.trim().split('\n');
  const result = {};

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const col = name => headers.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const raw = parseCSVLine(lines[i]);
    if (raw.length < 6) continue;
    const v = raw.map(s => s.trim());

    const id = v[col('id')];
    if (!id) continue;

    const availCol = col('available');
    result[id] = {
      id,
      position:              v[col('position')] || '',
      name:                  v[col('name')] || '',
      price:                 parseInt(v[col('price')]) || 0,
      primary_chance:        parseFloat(v[col('primary_chance')]) || 0,
      secondary_chance:      parseFloat(v[col('secondary_chance')]) || 0,
      primary_description:   v[col('primary_description')] || '',
      primary_text1:         col('primary_text1')  >= 0 ? v[col('primary_text1')]  : '',
      primary_text2:         col('primary_text2')  >= 0 ? v[col('primary_text2')]  : '',
      secondary_description: v[col('secondary_description')] || '',
      secondary_text1:       col('secondary_text1') >= 0 ? v[col('secondary_text1')] : '',
      available:             availCol < 0 || v[availCol] !== 'N'
    };
  }

  return result;
}
```

---

## 2. `script.js` — Remove the orphaned `beasant` condition

In `applyHeroBonuses`, find this line inside the GK/DEF block:

```js
const wembleyCondition = heroId === 'beasant' ? oppStars > ownStars : true;
```

Replace it with:

```js
const wembleyCondition = true;
```

---

## 3. `script.js` — Add a `formatMoney` helper and use it consistently

Add this function near `parseMoney`:

```js
const CURRENCY = '£';

function formatMoney(amount) {
  return `${CURRENCY}${amount.toLocaleString()}`;
}
```

Then replace every money display string in the file:
- All `$${...toLocaleString()}` occurrences → `formatMoney(...)`
- The hero card template in `renderHeroCards` already uses `£` — it will now use `formatMoney` automatically once the template calls it

Specifically, update these lines in `renderHeroCards`:
```js
// before
<span class="hero-card-meta-price">£${hero.price.toLocaleString()}</span>
// after
<span class="hero-card-meta-price">${formatMoney(hero.price)}</span>
```

And in `simulateMatch` / `updateStadium` / `openMatchInfoModal` — anywhere `$${...toLocaleString()}` appears, switch to `formatMoney(...)`.

---

## 4. `script.js` — Remove zero-weight entries from `goalChancesByStars`

In the `goalChancesByStars` constant, remove every `{ goals: X, weight: 0 }` entry. They are never selected and add noise to the probability table. The `rollGoals` function already handles sparse tables correctly — it computes `totalWeight` from whatever entries are present.

Current entries to remove:
- `home[1]`: `{ goals: 3, weight: 0 }`
- `home[2]`: `{ goals: 5, weight: 0 }`
- `home[3]`: `{ goals: 5, weight: 0 }`
- `away[1]`: `{ goals: 3, weight: 0 }`
- `away[2]`: `{ goals: 3, weight: 0 }` and `{ goals: 5, weight: 0 }`
- `away[3]`: `{ goals: 5, weight: 0 }`

---

## 5. `index.html` — Add `alt` to the logo image

Find:
```html
<img class="wembley-logo" src="images/wembley_logo_white.png">
```

Replace with:
```html
<img class="wembley-logo" src="images/wembley_logo_white.png" alt="Wembley">
```

---

## 6. `index.html` — Fix invalid `<b><p>` nesting in the earnings section

There are two places in `#matchEarningsSection` where `<p>` is nested inside `<b>`. This is invalid HTML — `<b>` is inline, `<p>` is block.

Find and replace both instances:

```html
<!-- before -->
<div id="totalHome">
  <b><p></p></b>
</div>
...
<div id="totalAway">
  <b><p></p></b>
</div>
```

```html
<!-- after -->
<div id="totalHome">
  <p></p>
</div>
...
<div id="totalAway">
  <p></p>
</div>
```

Then in `styles.css`, add a rule to make the total row text bold visually (since the `<b>` wrapper is gone):

```css
#totalHome p,
#totalAway p {
  font-weight: bold;
}
```

---

## 7. `styles.css` — Remove dead CSS classes

Delete the following rules entirely — they are defined but never used:

- `.hero-card-bonus--sec` (the secondary description bar styling — this class is never applied in JS)
- `.cup-heroes-btn` and `.cup-heroes-btn:hover` (replaced by the slot-click flow)
- `footer { bottom: 0; }` — `bottom` has no effect without `position`; the actual footer is positioned via `.banner { position: fixed; bottom: 0; }`

---

## 8. `styles.css` — Remove ineffective `<option>` styles

Find and delete:

```css
#teamSelectHome option {
  height: 30px;
  overflow-y: auto;
  max-height: 200px;
}
```

These properties do not apply to `<option>` elements in any browser.

---

## 9. `styles.css` — Add `overscroll-behavior: contain` to scrollable modals

Find `.cup-heroes-modal-content` and add the property:

```css
.cup-heroes-modal-content {
  /* existing properties ... */
  overscroll-behavior: contain;
}
```

Do the same for `.cup-heroes-info-modal-content`:

```css
.cup-heroes-info-modal-content {
  /* existing properties ... */
  overscroll-behavior: contain;
}
```

This prevents scroll from bleeding through to the page body on iOS.

---

## Verification

After all changes:

1. Open `index.html` in a browser and confirm the app loads with teams and heroes populating correctly.
2. Simulate a match at each round — check earnings display `£` throughout.
3. Simulate a Semi Final or Final that ends in a draw — confirm penalty shootout runs to completion.
4. Open Cup Heroes for both teams, select heroes, simulate — confirm hero narrative renders in the match report.
5. Run a quick HTML validation check — confirm no `<b><p>` nesting warnings remain.
6. On mobile (or DevTools narrow viewport), open the Cup Heroes modal and scroll — confirm no body scroll bleed.
