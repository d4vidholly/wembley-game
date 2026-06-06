// ────────────────────────────────────────────────────────────
// ANALYTICS — Supabase event tracking
// ────────────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://ktfioofuawvvuqlebqby.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JlfdWbi45EymLEKOl--R4g_4w9N1SNN';

const _TABLE = 'game_events';

let _sessionId;
let _visitorId;
let _deviceType;
let _isReturnVisitor;
let _currentStage    = 'team_select';
let _stageEnteredAt  = Date.now();
let _penStartedAt    = null;

function _getDeviceType() {
  const w = screen.width;
  if (w < 768)  return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function _initIds() {
  const stored = localStorage.getItem('wembley-visitor-id');
  _isReturnVisitor = !!stored;
  _visitorId = stored || crypto.randomUUID();
  if (!stored) localStorage.setItem('wembley-visitor-id', _visitorId);

  _sessionId = sessionStorage.getItem('wembley-session-id') || crypto.randomUUID();
  sessionStorage.setItem('wembley-session-id', _sessionId);

  _deviceType = _getDeviceType();
}

function _autoFields() {
  return { session_id: _sessionId, visitor_id: _visitorId, device_type: _deviceType, timestamp: new Date().toISOString() };
}

async function _post(eventType, data) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${_TABLE}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({ session_id: _sessionId, event_type: eventType, data: { ..._autoFields(), ...data } }),
    });
    if (!res.ok) console.warn('[Analytics] Event rejected:', eventType, res.status, await res.text());
  } catch (err) {
    console.warn('[Analytics] Failed to log event:', eventType, err);
  }
}

function _logDropOff() {
  const timeOnStage = Math.round((Date.now() - _stageEnteredAt) / 1000);
  _post('drop_off', { stage: _currentStage, time_on_stage_seconds: timeOnStage });
}

window.Analytics = {
  init() {
    _initIds();
    _stageEnteredAt = Date.now();

    _post('session_start', {
      visitor_id:       _visitorId,
      device_type:      _deviceType,
      is_return_visitor: _isReturnVisitor,
      referrer:         document.referrer,
      user_agent:       navigator.userAgent,
    });

    window.addEventListener('beforeunload', _logDropOff);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') _logDropOff();
    });
  },

  setStage(stage) {
    _currentStage   = stage;
    _stageEnteredAt = Date.now();
  },

  logMatchStart({ home_team, away_team, skin, cup_heroes_selected, round }) {
    _post('match_start', { home_team, away_team, skin, cup_heroes_selected, round });
  },

  logMatchCompleted({ home_team, away_team, home_score, away_score, winner, skin, round, duration_seconds, cup_heroes_used, went_to_penalties }) {
    _post('match_completed', { home_team, away_team, home_score, away_score, winner, skin, round, duration_seconds, cup_heroes_used, went_to_penalties });
  },

  logPenaltyShootoutStarted({ home_team, away_team, score_at_90_mins }) {
    _penStartedAt = Date.now();
    _post('penalty_shootout_started', { home_team, away_team, score_at_90_mins });
  },

  logPenaltyShootoutCompleted({ home_team, away_team, winner, kicks_taken }) {
    const full_engagement = _penStartedAt !== null && (Date.now() - _penStartedAt) <= 60000;
    _penStartedAt = null;
    _post('penalty_shootout_completed', { home_team, away_team, winner, full_engagement, kicks_taken });
  },

  logCupHeroSelected({ player_name, slot, team }) {
    _post('cup_hero_selected', { player_name, slot, team });
  },

  logSkinChanged({ from_skin, to_skin }) {
    _post('skin_changed', { from_skin, to_skin });
  },
};
