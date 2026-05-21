
// ────────────────────────────────────────────────────────────
// CONFIGURATION
// Paste your Google Sheets "Publish to web" CSV URL here.
// File → Share → Publish to web → Sheet1 → CSV → Copy link
// ────────────────────────────────────────────────────────────
const SHEET_CSV_URL        = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5kLTvHx5Vk_gL6Hw2w82zMDgVXfaEM_UJoB1OR1I8UwNgVE4ajNEOsTzQUFFtpZp2dVfqiNozzXTu/pub?gid=0&single=true&output=csv';
const HEROES_CSV_URL       = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVkuUfkTOQ-OUfbb8ze1HcVKwWWXtf1rbRYMyPPYoFZZ1TB02oSmbluCsRwvyRH0yhP8EJu5CQSPFD/pub?gid=2026393616&single=true&output=csv';
const PEN_KICK_DURATION_MS = 2000; // ms per kick
const BADGES_PATH          = 'badges/';
const HEROES_PATH          = 'heroes/';

// ────────────────────────────────────────────────────────────
// STATIC GAME DATA
// ────────────────────────────────────────────────────────────
const roundData = {
  "Round of 32":  { revenue: "-",     ifDraw: "Replay if Draw",            kickoff: "15:00 - Day",   stadium: "" },
  "Round of 16":  { revenue: "-",     ifDraw: "Replay if Draw",            kickoff: "19:45 - Night", stadium: "" },
  "Quarter Final":{ revenue: "-",     ifDraw: "Replay if Draw",            kickoff: "15:00 - Day",   stadium: "" },
  "Semi Final":   { revenue: "$30000",ifDraw: "Penalty Shoot Out if Draw", kickoff: "15:00 - Day",   stadium: "Wembley" },
  "Final":        { revenue: "$75000",ifDraw: "Penalty Shoot Out if Draw", kickoff: "16:30 - Day",   stadium: "Wembley" }
};

const goalChancesByStars = {
  home: {
    1: [{ goals: 0, weight: 33.3 }, { goals: 1, weight: 16.7 }, { goals: 2, weight: 16.7 }, { goals: 3, weight: 0    }, { goals: 4, weight: 16.7 }, { goals: 5, weight: 16.7 }],
    2: [{ goals: 0, weight: 16.7 }, { goals: 1, weight: 16.7 }, { goals: 2, weight: 33.3 }, { goals: 3, weight: 16.7 }, { goals: 4, weight: 16.7 }, { goals: 5, weight: 0    }],
    3: [{ goals: 0, weight: 16.7 }, { goals: 1, weight: 16.7 }, { goals: 2, weight: 16.7 }, { goals: 3, weight: 16.7 }, { goals: 4, weight: 33.3 }, { goals: 5, weight: 0    }]
  },
  away: {
    1: [{ goals: 0, weight: 33.3 }, { goals: 1, weight: 16.7 }, { goals: 2, weight: 16.7 }, { goals: 3, weight: 0    }, { goals: 4, weight: 16.7 }, { goals: 5, weight: 16.7 }],
    2: [{ goals: 0, weight: 16.7 }, { goals: 1, weight: 33.3 }, { goals: 2, weight: 16.7 }, { goals: 3, weight: 0    }, { goals: 4, weight: 16.7 }, { goals: 5, weight: 0    }],
    3: [{ goals: 0, weight: 16.7 }, { goals: 1, weight: 16.7 }, { goals: 2, weight: 16.7 }, { goals: 3, weight: 33.3 }, { goals: 4, weight: 16.7 }, { goals: 5, weight: 0    }]
  }
};

// ────────────────────────────────────────────────────────────
// APP STATE
// ────────────────────────────────────────────────────────────
let teams = {};
let heroes = {};
let selectedHeroesHome = [];
let selectedHeroesAway = [];

// ────────────────────────────────────────────────────────────
// DATA — FETCH & PARSE FROM GOOGLE SHEETS
// ────────────────────────────────────────────────────────────

/**
 * Fetches the published Google Sheet CSV, parses it into the teams
 * object, populates both dropdowns, then initialises the UI.
 *
 * Expected sheet columns (header row is read to map column names):
 *   name | badge | division | stars | stadium | gate | location
 *
 *   name      – Exact team name used as the lookup key (e.g. "Arsenal")
 *   badge     – SVG filename in the same folder (e.g. "arsenal.svg")
 *   division  – Display string (e.g. "Premier Division")
 *   stars     – Number: 1, 2 or 3
 *   stadium   – Display string (e.g. "Emirates Stadium")
 *   gate      – Gate revenue as a plain number, no $ (e.g. 12000)
 *   location  – Display string (e.g. "North London")
 */
async function fetchCSV(url, cacheKey) {
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  sessionStorage.setItem(cacheKey, text);
  return text;
}

async function fetchTeams() {
  setLoadingState(true);
  try {
    const csv = await fetchCSV(SHEET_CSV_URL, 'wembley-teams');
    teams = parseTeamsCSV(csv);
    populateTeamSelects();
    initUI();
  } catch (err) {
    console.error('Failed to load team data:', err);
    const errorHTML = '<option value="">⚠ Could not load teams — check sheet URL</option>';
    document.getElementById('teamSelectHome').innerHTML = errorHTML;
    document.getElementById('teamSelectAway').innerHTML = errorHTML;
  } finally {
    setLoadingState(false);
  }
}

function parseTeamsCSV(csv) {
  const lines = csv.trim().split('\n');
  const result = {};

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const col = name => headers.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const raw = parseCSVLine(lines[i]);
    if (raw.length < 7) continue;
    const v = raw.map(s => s.trim());

    const name = v[col('name')];
    if (!name) continue;

    const starCount = Math.min(Math.max(parseInt(v[col('stars')]) || 1, 1), 3);
    const gate      = v[col('gate')] || '0';
    const color1    = col('color1') >= 0 ? v[col('color1')] : '';
    const color2    = col('color2') >= 0 ? v[col('color2')] : '';

    result[name] = {
      badge:    BADGES_PATH + v[col('badge')],
      division: v[col('division')],
      stars:    '★'.repeat(starCount),
      stadium:  v[col('stadium')],
      gate:     `$${parseInt(gate.replace(/[^0-9]/g, '')) || 0}`,
      location: v[col('location')],
      color1:   color1 || null,
      color2:   color2 || null
    };
  }

  return result;
}

// RFC 4180-compliant CSV parser (handles quoted fields and escaped quotes)
function parseCSVLine(line) {
  const result = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { // escaped quote inside a quoted field
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  result.push(field);
  return result;
}

function populateTeamSelects() {
  const sortedNames = Object.keys(teams).sort();
  const optionsHTML = sortedNames
    .map(name => `<option value="${name}">${name}</option>`)
    .join('\n');

  document.getElementById('teamSelectHome').innerHTML = optionsHTML;
  document.getElementById('teamSelectAway').innerHTML = optionsHTML;

  // Restore default selections if those teams exist in the sheet
  if (teams['Arsenal'])   document.getElementById('teamSelectHome').value = 'Arsenal';
  if (teams['Tottenham']) document.getElementById('teamSelectAway').value = 'Tottenham';
}

function setLoadingState(loading) {
  document.getElementById('simulateButton').disabled = loading;
  if (loading) {
    const placeholder = '<option value="">Loading teams…</option>';
    document.getElementById('teamSelectHome').innerHTML = placeholder;
    document.getElementById('teamSelectAway').innerHTML = placeholder;
  }
}

async function fetchHeroes() {
  try {
    const csv = await fetchCSV(HEROES_CSV_URL, 'wembley-heroes');
    heroes = parseHeroesCSV(csv);
  } catch (err) {
    console.error('Failed to load heroes data:', err);
  }
}

function parseHeroesCSV(csv) {
  const lines = csv.trim().split('\n');
  const result = {};
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 8) continue;
    const vals = values.map(v => v.trim());
    const [id, position, name, price, primaryChance, secondaryChance, primaryDesc, secondaryDesc] = vals;
    if (!id) continue;
    result[id] = {
      id,
      position,
      name,
      price:                parseInt(price) || 0,
      primary_chance:       parseFloat(primaryChance) || 0,
      secondary_chance:     parseFloat(secondaryChance) || 0,
      primary_description:  primaryDesc,
      secondary_description: secondaryDesc,
      available:            vals[8] !== 'N'
    };
  }
  return result;
}

// ────────────────────────────────────────────────────────────
// UI FUNCTIONS
// ────────────────────────────────────────────────────────────

function initUI() {
  updateHomeTeamUI();
  updateAwayTeamUI();
  updateRoundUI();
  enableSimulateButton();
}

function updateHomeTeamUI() {
  const selectedTeam = document.getElementById('teamSelectHome').value;

  if (teams[selectedTeam]) {
    document.getElementById('teamBadgeHome').src = teams[selectedTeam].badge;
    document.getElementById('divisionTextHome').textContent = teams[selectedTeam].division;
    const starContainer = document.getElementById('starContainerHome');
    starContainer.innerHTML = teams[selectedTeam].stars;
    starContainer.style.display = 'block';
  } else {
    document.getElementById('teamBadgeHome').src = '#';
    document.getElementById('divisionTextHome').textContent = '';
    document.getElementById('starContainerHome').style.display = 'none';
  }

  updateStadium();
  enableSimulateButton();
}

function updateAwayTeamUI() {
  const selectedTeam = document.getElementById('teamSelectAway').value;

  if (teams[selectedTeam]) {
    document.getElementById('teamBadgeAway').src = teams[selectedTeam].badge;
    document.getElementById('divisionTextAway').textContent = teams[selectedTeam].division;
    const starContainer = document.getElementById('starContainerAway');
    starContainer.innerHTML = teams[selectedTeam].stars;
    starContainer.style.display = 'block';
  } else {
    document.getElementById('teamBadgeAway').src = '#';
    document.getElementById('divisionTextAway').textContent = '';
    document.getElementById('starContainerAway').style.display = 'none';
  }

  enableSimulateButton();
}

function updateStadium() {
  const selectedRound = document.getElementById('roundSelect').value;
  const selectedTeam  = document.getElementById('teamSelectHome').value;
  const stadiumText   = document.getElementById('stadiumTextHome');
  const prizeMoney    = document.getElementById('prizeMoney');

  if (selectedRound === 'Semi Final' || selectedRound === 'Final') {
    stadiumText.textContent = 'Wembley';
    prizeMoney.innerText    = roundData[selectedRound].revenue;
  } else if (teams[selectedTeam]) {
    stadiumText.textContent = teams[selectedTeam].stadium;
    prizeMoney.innerText    = teams[selectedTeam].gate;
  } else {
    stadiumText.textContent = '';
    prizeMoney.innerText    = '';
  }
}

function updateRoundUI() {
  const selectedRound = document.getElementById('roundSelect').value;

  if (roundData[selectedRound]) {
    document.getElementById('ifDraw').innerText      = roundData[selectedRound].ifDraw;
    document.getElementById('kickOffTime').innerText = roundData[selectedRound].kickoff;
  } else {
    document.getElementById('ifDraw').innerText      = '-';
    document.getElementById('kickOffTime').innerText = '-';
  }

  updateStadium();
  enableSimulateButton();
}

function enableSimulateButton() {
  const homeSelected  = !!document.getElementById('teamSelectHome').value;
  const awaySelected  = !!document.getElementById('teamSelectAway').value;
  const roundSelected = !!document.getElementById('roundSelect').value;
  document.getElementById('simulateButton').disabled = !(homeSelected && awaySelected && roundSelected);
}

function toggleEarnings() {
  const section = document.getElementById('matchEarningsSection');
  const btn = document.getElementById('earningsToggleBtn');
  const showing = section.style.display === 'block';
  section.style.display = showing ? 'none' : 'block';
  btn.textContent = showing ? 'Earnings ▼' : 'Earnings ▲';
}

function closeModal() {
  document.getElementById('matchReportModal').classList.add('hidden');
  document.getElementById('replayButton').classList.add('hidden');
  document.getElementById('matchEarningsSection').style.display = '';
  document.getElementById('earningsToggleBtn').textContent = 'Earnings ▼';
  selectedHeroesHome = [];
  selectedHeroesAway = [];
  updateHeroSummary('home');
  updateHeroSummary('away');
}

// ────────────────────────────────────────────────────────────
// GAME LOGIC
// ────────────────────────────────────────────────────────────

function parseStars(starString) {
  return starString.replace(/[^★]/g, '').length;
}

function applyHeroBonuses(homeGoals, awayGoals, homeName, awayName, round) {
  const isWembley = (round === 'Semi Final' || round === 'Final');
  const homeStars = parseStars(teams[homeName].stars);
  const awayStars = parseStars(teams[awayName].stars);
  const homeHeroEvents = [];
  const awayHeroEvents = [];

  function applyHero(heroId, isHome) {
    const hero = heroes[heroId];
    if (!hero) return;
    const ownName = isHome ? homeName : awayName;
    const oppName = isHome ? awayName : homeName;
    const event = { id: heroId, name: hero.name, position: hero.position, primaryFired: false, secondaryFired: false, tooltip: `${hero.name} didn't affect the match` };

    if (hero.position === 'GK' || hero.position === 'DEF') {
      const wembleyBoost = isWembley && hero.secondary_chance > hero.primary_chance;
      const chance = wembleyBoost ? hero.secondary_chance : hero.primary_chance;
      if (Math.random() * 100 < chance) {
        if (isHome)  awayGoals = Math.max(0, awayGoals - 1);
        else         homeGoals = Math.max(0, homeGoals - 1);
        event.primaryFired = true;
        const gkPhrases    = ['made a great save', 'kept the ball out', 'pulled off a stunning stop', 'saved the penalty'];
        const defPhrases   = ['made a last-ditch tackle', 'made a vital block', 'cleared off the line', 'won the crucial challenge'];
        const wembleyExtra = hero.position === 'GK' ? 'pulled off a Wembley save' : 'made a Wembley-worthy block';
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        if (wembleyBoost) {
          event.secondaryFired = true;
          event.tooltip = `${hero.name} ${wembleyExtra} — denied ${oppName} at Wembley`;
        } else {
          const phrase = hero.position === 'GK' ? pick(gkPhrases) : pick(defPhrases);
          event.tooltip = `${hero.name} ${phrase} — denied ${oppName}`;
        }
      }

    } else if (hero.position === 'MID') {
      if (Math.random() * 100 < hero.primary_chance) {
        if (isHome) homeGoals++; else awayGoals++;
        event.primaryFired = true;
        event.tooltip = `Added a goal for ${ownName}`;
      }

    } else if (hero.position === 'STR') {
      const wembleyBoost = isWembley && hero.secondary_chance > hero.primary_chance;
      const primaryChance = wembleyBoost ? hero.secondary_chance : hero.primary_chance;

      if (Math.random() * 100 < primaryChance) {
        if (isHome) homeGoals++; else awayGoals++;
        event.primaryFired = true;
        event.tooltip = `Scored for ${ownName}`;
        if (wembleyBoost) { event.secondaryFired = true; event.tooltip = `Scored for ${ownName} — Wembley boost`; }

        // Haaland only: secondary — score again vs lower-division opposition
        if (heroId === 'haaland') {
          const ownStars = isHome ? homeStars : awayStars;
          const oppStars = isHome ? awayStars : homeStars;
          if (oppStars < ownStars && Math.random() * 100 < hero.secondary_chance) {
            if (isHome) homeGoals++; else awayGoals++;
            event.secondaryFired = true;
            event.tooltip = `Scored twice for ${ownName}!`;
          }
        }
      }
    }

    (isHome ? homeHeroEvents : awayHeroEvents).push(event);
  }

  selectedHeroesHome.forEach(id => applyHero(id, true));
  selectedHeroesAway.forEach(id => applyHero(id, false));
  return { homeGoals, awayGoals, homeHeroEvents, awayHeroEvents };
}

function rollGoals(stars, side = 'home') {
  const goalChances = goalChancesByStars[side]?.[stars] || [];
  const totalWeight = goalChances.reduce((sum, entry) => sum + entry.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulative = 0;
  for (const entry of goalChances) {
    cumulative += entry.weight;
    if (random <= cumulative) return entry.goals;
  }
  return 0;
}

function parseMoney(moneyString) {
  return parseInt(String(moneyString).replace(/[^0-9]/g, '')) || 0;
}

function calculatePrizeMoney(homeTeam, winner, round) {
  const totalRevenue = (round === 'Semi Final' || round === 'Final')
    ? parseMoney(roundData[round].revenue)
    : parseMoney(teams[homeTeam].gate);

  let homeShare = 0;
  let awayShare = 0;

  if (winner === 'draw') {
    homeShare = awayShare = totalRevenue / 2;
  } else if (winner === 'home') {
    homeShare = (2 / 3) * totalRevenue;
    awayShare = (1 / 3) * totalRevenue;
  } else if (winner === 'away') {
    homeShare = (1 / 3) * totalRevenue;
    awayShare = (2 / 3) * totalRevenue;
  }

  return { home: Math.round(homeShare), away: Math.round(awayShare) };
}

function calculateRoundBonus(round, stars) {
  const bonusMatrix = {
    "Quarter Final": { 3: 2000, 2: 4000, 1: 6000 },
    "Semi Final":    { 3: 4000, 2: 8000, 1: 12000 }
  };
  return bonusMatrix[round]?.[parseStars(stars)] || 0;
}

// ────────────────────────────────────────────────────────────
// MATCH SIMULATION
// ────────────────────────────────────────────────────────────

function simulateMatch(homeName, awayName, round, replay = false) {
  resetPenaltyUI();

  const homeStars = parseStars(teams[homeName].stars);
  const awayStars = parseStars(teams[awayName].stars);
  let homeGoals = rollGoals(homeStars, 'home');
  let awayGoals = rollGoals(awayStars, 'away');
  const heroResult = applyHeroBonuses(homeGoals, awayGoals, homeName, awayName, round);
  homeGoals = heroResult.homeGoals;
  awayGoals = heroResult.awayGoals;

  // — Match report header —
  document.getElementById('reportRound').innerText    = `FA Cup ${round}${replay ? ' Replay' : ''} Result`;
  document.getElementById('reportHomeBadge').src      = teams[homeName].badge;
  document.getElementById('reportAwayBadge').src      = teams[awayName].badge;
  document.getElementById('reportHomeName').innerText = homeName.toUpperCase();
  document.getElementById('reportAwayName').innerText = awayName.toUpperCase();
  document.getElementById('reportScore').innerText    = `${homeGoals} - ${awayGoals}`;

  // — Hero report —
  renderHeroReport(heroResult);

  // — Determine result —
  const knockoutRounds = ['Semi Final', 'Final'];
  let winnerKey, resultText;
  let isPenaltyShootout = false;
  let penaltyWinner     = null;

  if (homeGoals > awayGoals) {
    winnerKey  = 'home';
    resultText = round === 'Final'
      ? `${homeName} win the FA Cup!`
      : `${homeName} progress to the next round`;

  } else if (awayGoals > homeGoals) {
    winnerKey  = 'away';
    resultText = round === 'Final'
      ? `${awayName} win the FA Cup!`
      : `${awayName} progress to the next round`;

  } else {
    if (knockoutRounds.includes(round) || replay) {
      penaltyWinner     = Math.random() < 0.5 ? homeName : awayName;
      winnerKey         = penaltyWinner === homeName ? 'home' : 'away';
      isPenaltyShootout = true;
    } else {
      winnerKey  = 'draw';
      resultText = 'Match Drawn – Replay Scheduled';
      showReplayButton(homeName, awayName, round);
    }
  }

  // — Gate revenue —
  const prize = calculatePrizeMoney(homeName, winnerKey, round);
  document.querySelector('#ticketHome p').textContent = `$${prize.home.toLocaleString()}`;
  document.querySelector('#ticketAway p').textContent = `$${prize.away.toLocaleString()}`;

  // — Round bonus (not awarded on a drawn QF before the replay) —
  let homeBonusAmount = 0;
  let awayBonusAmount = 0;
  if (!(round === 'Quarter Final' && winnerKey === 'draw' && !replay)) {
    homeBonusAmount = calculateRoundBonus(round, teams[homeName].stars);
    awayBonusAmount = calculateRoundBonus(round, teams[awayName].stars);
  }
  document.querySelector('#prizeHome p').textContent = `$${homeBonusAmount.toLocaleString()}`;
  document.querySelector('#prizeAway p').textContent = `$${awayBonusAmount.toLocaleString()}`;

  // — Totals —
  updateTotaliser();

  // — Penalty shootout takes over modal display —
  if (isPenaltyShootout) {
    startPenaltyShootout(homeName, awayName, penaltyWinner, round);
    return;
  }

  // — Show modal —
  document.getElementById('reportResult').innerText = resultText;
  document.getElementById('matchReportModal').classList.remove('hidden');

  // — Confetti on Final win —
  if (round === 'Final') {
    const winnerName = winnerKey === 'home' ? homeName : awayName;
    const c1 = teams[winnerName].color1 || '#daa520';
    const c2 = teams[winnerName].color2 || '#ffffff';
    fireConfetti(c1, c2);
  }
}

function showReplayButton(originalHome, originalAway, round) {
  const replayButton = document.getElementById('replayButton');
  replayButton.classList.remove('hidden');

  // Clone to remove any stale click listeners
  const newButton = replayButton.cloneNode(true);
  replayButton.parentNode.replaceChild(newButton, replayButton);

  newButton.addEventListener('click', () => {
    // FA Cup rule: replay is hosted by the original away team — swap heroes so they follow their teams
    [selectedHeroesHome, selectedHeroesAway] = [selectedHeroesAway, selectedHeroesHome];
    simulateMatch(originalAway, originalHome, round, true);
    newButton.classList.add('hidden');
  });
}

function updateTotaliser() {
  const getAmount = selector => {
    const text = document.querySelector(selector).textContent.replace(/[^\d]/g, '');
    return Number(text) || 0;
  };

  const homeTotal = getAmount('#ticketHome p') + getAmount('#prizeHome p');
  const awayTotal = getAmount('#ticketAway p') + getAmount('#prizeAway p');

  document.querySelector('#totalHome p').textContent = `$${homeTotal.toLocaleString()}`;
  document.querySelector('#totalAway p').textContent = `$${awayTotal.toLocaleString()}`;
}

// ────────────────────────────────────────────────────────────
// CONFETTI
// ────────────────────────────────────────────────────────────

function cssColorToHex(color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function fireConfetti(color1, color2) {
  const c1 = cssColorToHex(color1);
  const c2 = cssColorToHex(color2);
  const end = Date.now() + 4500;

  (function frame() {
    confetti({ particleCount: 7, angle: 60,  spread: 65, origin: { x: 0 }, colors: [c1], zIndex: 1100 });
    confetti({ particleCount: 3, angle: 60,  spread: 65, origin: { x: 0 }, colors: [c2], zIndex: 1100 });
    confetti({ particleCount: 7, angle: 120, spread: 65, origin: { x: 1 }, colors: [c1], zIndex: 1100 });
    confetti({ particleCount: 3, angle: 120, spread: 65, origin: { x: 1 }, colors: [c2], zIndex: 1100 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ────────────────────────────────────────────────────────────
// PENALTY SHOOTOUT
// ────────────────────────────────────────────────────────────

function resetPenaltyUI() {
  document.getElementById('penaltyCirclesSection').classList.add('hidden');
  document.getElementById('startPenButton').classList.add('hidden');
  const penDisplay = document.getElementById('penaltyScoreDisplay');
  penDisplay.classList.add('hidden');
  penDisplay.textContent = '';
  document.getElementById('matchEarningsSection').style.display = '';
  document.querySelector('.modal-buttons').style.display = '';
  ['home', 'away'].forEach(side => {
    for (let i = 0; i < 5; i++) {
      document.getElementById(`pen-${side}-${i}`).className = 'pen-circle';
    }
  });
}

function computePenaltyResults(winner, homeName, awayName) {
  function generateLoserKicks() {
    const kicks = [];
    for (let i = 0; i < 4; i++) kicks.push(Math.random() > 0.25);
    const allScored = kicks.every(k => k);
    kicks.push(allScored ? false : Math.random() > 0.25);
    return kicks;
  }
  const winnerKicks = [true, true, true, true, true];
  const loserKicks  = generateLoserKicks();
  return {
    home: winner === homeName ? winnerKicks : loserKicks,
    away: winner === awayName ? winnerKicks : loserKicks
  };
}

function startPenaltyShootout(homeName, awayName, winner, round) {
  const penResults = computePenaltyResults(winner, homeName, awayName);

  const sequence = [];
  for (let i = 0; i < 5; i++) {
    sequence.push({ side: 'home', kickIndex: i, scored: penResults.home[i] });
    sequence.push({ side: 'away', kickIndex: i, scored: penResults.away[i] });
  }

  document.getElementById('matchEarningsSection').style.display = 'none';
  document.querySelector('.modal-buttons').style.display = 'none';
  document.getElementById('reportResult').innerText = 'End of 90 minutes';

  const startBtn = document.getElementById('startPenButton');
  startBtn.classList.remove('hidden');
  startBtn.onclick = () => {
    startBtn.classList.add('hidden');
    document.getElementById('reportResult').innerText = 'Penalty Shoot Out in Play';
    document.getElementById('penaltyCirclesSection').classList.remove('hidden');
    animateKicks(sequence, 0, 0, 0, winner, round, homeName, awayName);
  };

  document.getElementById('matchReportModal').classList.remove('hidden');
}

function animateKicks(sequence, index, homeScore, awayScore, winner, round, homeName, awayName) {
  if (index >= sequence.length) {
    finishShootout(homeScore, awayScore, winner, round, homeName, awayName);
    return;
  }

  const { side, kickIndex, scored } = sequence[index];
  const circle = document.getElementById(`pen-${side}-${kickIndex}`);

  circle.classList.add('pen-circle--active');

  setTimeout(() => {
    circle.classList.remove('pen-circle--active');
    circle.classList.add(scored ? 'pen-circle--scored' : 'pen-circle--missed');

    const newHomeScore = homeScore + (side === 'home' && scored ? 1 : 0);
    const newAwayScore = awayScore + (side === 'away' && scored ? 1 : 0);

    // Early termination: check if the trailing team can no longer win
    const homeTaken = Math.ceil((index + 1) / 2);
    const awayTaken = Math.floor((index + 1) / 2);
    const homeLeft  = 5 - homeTaken;
    const awayLeft  = 5 - awayTaken;

    const homeCannotWin = newAwayScore > newHomeScore + homeLeft;
    const awayCannotWin = newHomeScore > newAwayScore + awayLeft;

    if (homeCannotWin || awayCannotWin) {
      setTimeout(() => {
        finishShootout(newHomeScore, newAwayScore, winner, round, homeName, awayName);
      }, PEN_KICK_DURATION_MS * 0.2);
      return;
    }

    setTimeout(() => {
      animateKicks(sequence, index + 1, newHomeScore, newAwayScore, winner, round, homeName, awayName);
    }, PEN_KICK_DURATION_MS * 0.2);
  }, PEN_KICK_DURATION_MS * 0.8);
}

function finishShootout(homeScore, awayScore, winner, round, homeName, awayName) {
  const penDisplay = document.getElementById('penaltyScoreDisplay');
  penDisplay.textContent = `${homeScore} - ${awayScore} on pens`;
  penDisplay.classList.remove('hidden');

  document.getElementById('reportResult').innerText = round === 'Final'
    ? `${winner} win the FA Cup on penalties!`
    : `${winner} win on penalties and progress to the next round`;

  document.getElementById('penaltyCirclesSection').classList.add('hidden');
  document.getElementById('matchEarningsSection').style.display = '';
  document.querySelector('.modal-buttons').style.display = '';

  if (round === 'Final') {
    const c1 = teams[winner].color1 || '#daa520';
    const c2 = teams[winner].color2 || '#ffffff';
    fireConfetti(c1, c2);
  }
}

// ────────────────────────────────────────────────────────────
// MATCH INFO MODAL (mobile)
// ────────────────────────────────────────────────────────────

function openMatchInfoModal() {
  const round    = document.getElementById('roundSelect').value;
  const homeName = document.getElementById('teamSelectHome').value;
  const data     = roundData[round] || {};
  const isWembley = (round === 'Semi Final' || round === 'Final');

  document.getElementById('matchInfoRound').textContent   = round || '—';
  document.getElementById('matchInfoKickoff').textContent = data.kickoff || '—';
  document.getElementById('matchInfoStadium').textContent = isWembley ? 'Wembley' : (teams[homeName]?.stadium || '—');
  document.getElementById('matchInfoPrize').textContent   = isWembley ? (data.revenue || '—') : (teams[homeName]?.gate || '—');
  document.getElementById('matchInfoDraw').textContent    = data.ifDraw || '—';

  document.getElementById('matchInfoModal').classList.remove('hidden');
}

// ────────────────────────────────────────────────────────────
// CUP HEROES UI
// ────────────────────────────────────────────────────────────

function renderHeroReport(heroResult) {
  const container = document.getElementById('heroNarrative');
  const hasHeroes = heroResult.homeHeroEvents.length > 0 || heroResult.awayHeroEvents.length > 0;
  if (!hasHeroes) { container.style.display = 'none'; container.innerHTML = ''; return; }

  const posColors = { GK: '#B8413B', DEF: '#AAA54A', MID: '#31813C', STR: '#BBBCB9' };

  function buildSlots(events) {
    const slots = [...events];
    while (slots.length < 3) slots.push(null);
    return slots.slice(0, 3).map(ev => {
      if (!ev) return `<div class="hero-report-slot hero-report-slot--empty"><div class="hero-report-image"></div></div>`;
      const color = posColors[ev.position] || '#444';
      const state = ev.secondaryFired ? '--bonus' : ev.primaryFired ? '--active' : '--blank';
      const initials = ev.name.slice(0, 2).toUpperCase();
      return `<div class="hero-report-slot hero-report-slot${state}">
        <div class="hero-report-image" style="background:${color}; border-color:${color}">
          <img src="${HEROES_PATH}${ev.id}.png" class="hero-report-photo" alt="${ev.name}" onerror="this.src='${HEROES_PATH}${ev.id}.jpg';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display=''}">
          <span style="display:none">${initials}</span>
        </div>
        <span class="hero-report-pos">${ev.position}</span>
        <div class="hero-report-tooltip">${ev.tooltip}</div>
      </div>`;
    }).join('');
  }

  container.style.display = 'block';
  container.innerHTML = `<div class="hero-report-row">
    <div class="hero-report-side">${buildSlots(heroResult.homeHeroEvents)}</div>
    <div class="hero-report-divider"></div>
    <div class="hero-report-side">${buildSlots(heroResult.awayHeroEvents)}</div>
  </div>`;
}

function openCupHeroesInfoModal() {
  // Reset to panel 1
  document.querySelectorAll('.demo-panel').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
  document.querySelectorAll('.demo-dot').forEach((d, i) => {
    d.classList.toggle('active', i === 0);
  });
  document.getElementById('demoNextBtn').textContent = 'Next';
  document.getElementById('cupHeroesInfoModal').classList.remove('hidden');
}

function advanceDemoPanel() {
  const panels = document.querySelectorAll('.demo-panel');
  const dots   = document.querySelectorAll('.demo-dot');
  const btn    = document.getElementById('demoNextBtn');
  const current = [...panels].findIndex(p => p.classList.contains('active'));

  if (current >= panels.length - 1) {
    document.getElementById('cupHeroesInfoModal').classList.add('hidden');
    return;
  }

  panels[current].classList.remove('active');
  panels[current + 1].classList.add('active');
  dots[current].classList.remove('active');
  dots[current + 1].classList.add('active');

  btn.textContent = current + 1 >= panels.length - 1 ? 'Got it' : 'Next';
}

function setSkin(skin) {
  document.body.dataset.theme = skin;
  const labels = { classic: 'Classic', 'classic-dark': 'Classic Dark', sky: 'Sky' };
  document.getElementById('skinToggle').textContent = (labels[skin] || skin) + ' ▾';
  document.querySelectorAll('.skin-option[data-skin]').forEach(btn => {
    btn.style.display = btn.dataset.skin === skin ? 'none' : '';
  });
  document.getElementById('skinDropdown').classList.add('hidden');
}

function openCupHeroesModal(side, filter = 'All') {
  const selectId = side === 'home' ? 'teamSelectHome' : 'teamSelectAway';
  const teamName = document.getElementById(selectId).value;
  const teamData = teams[teamName];
  document.getElementById('cupHeroesBadgeImg').src = teamData ? teamData.badge : BADGES_PATH + 'arsenal.svg';
  document.getElementById('cupHeroesModal').dataset.side = side;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  renderHeroCards(side, filter);
  updateHeroCount(side);
  document.getElementById('cupHeroesModal').classList.remove('hidden');
}

function renderHeroCards(side, filter) {
  const grid = document.getElementById('cupHeroesGrid');
  const selected = side === 'home' ? selectedHeroesHome : selectedHeroesAway;
  const positionColors = { GK: '#B8413B', DEF: '#AAA54A', MID: '#31813C', STR: '#BBBCB9' };
  const filtered = Object.values(heroes).filter(h => filter === 'All' || h.position === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-heroes">No heroes available.</p>';
    return;
  }

  const otherSelected = side === 'home' ? selectedHeroesAway : selectedHeroesHome;

  grid.innerHTML = filtered.map(hero => {
    const isSelected    = selected.includes(hero.id);
    const isUnavailable = hero.available === false;
    const takenByOther  = !isSelected && otherSelected.includes(hero.id);
    const posConflict   = selected.some(id => heroes[id]?.position === hero.position && id !== hero.id);
    const atMax         = selected.length >= 3 && !isSelected && !posConflict;
    const isDisabled    = !isUnavailable && !isSelected && (atMax || takenByOther);
    const initials      = hero.name.slice(0, 2).toUpperCase();
    const bgColor       = positionColors[hero.position] || '#333';
    const stateClass    = isUnavailable ? ' hero-card--locked' : (isSelected ? ' hero-card--selected' : (isDisabled ? ' hero-card--disabled' : ''));

    return `<div class="hero-card${stateClass}" style="--pos-color: ${bgColor}" onclick="toggleHero('${side}', '${hero.id}')">
      <div class="hero-card-image" style="background: ${bgColor}">
        <img src="${HEROES_PATH}${hero.id}.png" class="hero-card-photo" alt="" onerror="this.src='${HEROES_PATH}${hero.id}.jpg';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'}">
        <span class="hero-card-initials">${initials}</span>
        ${isSelected ? '<div class="hero-card-check">✓</div>' : ''}
      </div>
      <div class="hero-card-name">${hero.name}</div>
      <div class="hero-card-meta">
        <span class="hero-card-meta-pos">${hero.position}</span>
        <span class="hero-card-meta-price">£${hero.price.toLocaleString()}</span>
      </div>
      <div class="hero-card-bonus">${hero.primary_description}</div>
      <div class="hero-card-bonus hero-card-bonus--sec">⚡ ${hero.secondary_description}</div>
    </div>`;
  }).join('');
}

function toggleHero(side, heroId) {
  const hero = heroes[heroId];
  if (!hero || hero.available === false) return;

  const selected      = side === 'home' ? selectedHeroesHome : selectedHeroesAway;
  const otherSelected = side === 'home' ? selectedHeroesAway : selectedHeroesHome;
  const idx = selected.indexOf(heroId);

  if (idx !== -1) {
    selected.splice(idx, 1);
  } else {
    if (otherSelected.includes(heroId)) return; // can't pick the same hero for both teams
    const conflictIdx = selected.findIndex(id => heroes[id]?.position === hero.position);
    if (conflictIdx !== -1) {
      selected.splice(conflictIdx, 1, heroId); // swap out the existing hero in this position
    } else if (selected.length >= 3) {
      return; // all 3 slots filled with different positions — no room
    } else {
      selected.push(heroId);
    }
  }

  const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'All';
  renderHeroCards(side, currentFilter);
  updateHeroCount(side);
  updateHeroSummary(side);
}

function updateHeroCount(side) {
  const selected = side === 'home' ? selectedHeroesHome : selectedHeroesAway;
  const el = document.getElementById('cupHeroesCount');
  el.textContent = `${selected.length} / 3 selected`;
  el.classList.toggle('count-full', selected.length === 3);
}

function updateHeroSummary(side) {
  const selected  = side === 'home' ? selectedHeroesHome : selectedHeroesAway;
  const slotsEl   = document.getElementById(side === 'home' ? 'heroSlotsHome' : 'heroSlotsAway');
  if (!slotsEl) return;

  const positionColors = { GK: '#B8413B', DEF: '#AAA54A', MID: '#31813C', STR: '#BBBCB9' };

  ['GK', 'DEF', 'MID', 'STR'].forEach(pos => {
    const slot   = slotsEl.querySelector(`[data-position="${pos}"]`);
    if (!slot) return;
    const heroId = selected.find(id => heroes[id]?.position === pos);
    if (heroId) {
      const hero = heroes[heroId];
      slot.style.background = positionColors[pos];
      slot.style.boxShadow = 'inset 0 0 0 4px ' + positionColors[pos];
      slot.innerHTML = `<img src="${HEROES_PATH}${hero.id}.png" class="hero-slot-photo" alt="${hero.name}" onerror="this.src='${HEROES_PATH}${hero.id}.jpg';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'}"><span class="hero-slot-initials" style="display:none">${hero.name.slice(0, 2).toUpperCase()}</span>`;
    } else {
      slot.style.background = '';
      slot.style.boxShadow = '';
      slot.innerHTML = `<span class="hero-slot-label">${pos}</span>`;
    }
  });
}

// ────────────────────────────────────────────────────────────
// INITIALISATION
// ────────────────────────────────────────────────────────────

window.addEventListener('load', function () {
  document.getElementById('teamSelectHome').addEventListener('change', updateHomeTeamUI);
  document.getElementById('teamSelectAway').addEventListener('change', updateAwayTeamUI);
  document.getElementById('roundSelect').addEventListener('change', updateRoundUI);

  document.getElementById('simulateButton').addEventListener('click', () => {
    const homeName = document.getElementById('teamSelectHome').value;
    const awayName = document.getElementById('teamSelectAway').value;
    const round    = document.getElementById('roundSelect').value;
    if (homeName && awayName && round) {
      simulateMatch(homeName, awayName, round, false);
    }
  });

  document.getElementById('closeReport').addEventListener('click', closeModal);

  const skinToggle = document.getElementById('skinToggle');
  const skinDropdown = document.getElementById('skinDropdown');
  skinToggle.addEventListener('click', e => {
    e.stopPropagation();
    skinDropdown.classList.toggle('hidden');
  });
  document.querySelectorAll('.skin-option[data-skin]').forEach(btn => {
    btn.addEventListener('click', () => {
      const skin = btn.dataset.skin;
      if (skin === 'retro' || skin === 'dark') {
        document.getElementById('skinDropdown').classList.add('hidden');
        document.getElementById('skinProductionModal').classList.remove('hidden');
      } else {
        setSkin(skin);
      }
    });
  });
  document.addEventListener('click', () => skinDropdown.classList.add('hidden'));
  setSkin('classic');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const side = document.getElementById('cupHeroesModal').dataset.side;
      renderHeroCards(side, btn.dataset.filter);
    });
  });

  document.getElementById('cupHeroesClose').addEventListener('click', () => {
    updateHeroSummary('home');
    updateHeroSummary('away');
    document.getElementById('cupHeroesModal').classList.add('hidden');
  });

  document.querySelectorAll('#heroSlotsHome .hero-slot, #heroSlotsAway .hero-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const side = slot.closest('#heroSlotsHome') ? 'home' : 'away';
      openCupHeroesModal(side, slot.dataset.position);
    });
  });

  // Kick off async data load — UI initialises inside fetchTeams() on success
  Promise.all([fetchTeams(), fetchHeroes()]).catch(err => console.error('Init failed:', err));
});
