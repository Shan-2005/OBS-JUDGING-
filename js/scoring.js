/* ==========================================================================
   ROBOFEST 2.0 - SCORING ENGINE & TIE-BREAKER RANKER
   ========================================================================== */

const PENALTY_RATES = {
  p_boundary: 5,   // +5s per wheel
  p_hand: 5,       // +5s per touch
  p_out_air: 10,   // +10s flat
  p_out_ground: 20, // +20s +5s/wheel (base 20s)
  p_skip: 25       // +25s per obstacle
};

// Current active penalty counts in memory
const currentPenalties = {
  r1: { p_boundary: 0, p_hand: 0, p_out_air: 0, p_out_ground: 0, p_skip: 0 },
  r2: { p_boundary: 0, p_hand: 0, p_out_air: 0, p_out_ground: 0, p_skip: 0 }
};

function adjustPenalty(round, key, delta) {
  if (!currentPenalties[round] || !(key in currentPenalties[round])) return;
  const newCount = Math.max(0, currentPenalties[round][key] + delta);
  currentPenalties[round][key] = newCount;
  
  // Update count & subtotal DOM
  const countEl = document.getElementById(`${round}-count-${key}`);
  const subEl = document.getElementById(`${round}-sub-${key}`);
  
  if (countEl) countEl.textContent = newCount;
  if (subEl) {
    const rate = PENALTY_RATES[key];
    subEl.textContent = `+${newCount * rate}s`;
  }

  updateScoreSummary(round);
}

function resetPenaltyCounts(round) {
  currentPenalties[round] = { p_boundary: 0, p_hand: 0, p_out_air: 0, p_out_ground: 0, p_skip: 0 };
  ['p_boundary', 'p_hand', 'p_out_air', 'p_out_ground', 'p_skip'].forEach(key => {
    const countEl = document.getElementById(`${round}-count-${key}`);
    const subEl = document.getElementById(`${round}-sub-${key}`);
    if (countEl) countEl.textContent = '0';
    if (subEl) subEl.textContent = '+0s';
  });
  updateScoreSummary(round);
}

function calculateTotalPenaltySeconds(round) {
  const p = currentPenalties[round];
  return (
    (p.p_boundary * PENALTY_RATES.p_boundary) +
    (p.p_hand * PENALTY_RATES.p_hand) +
    (p.p_out_air * PENALTY_RATES.p_out_air) +
    (p.p_out_ground * PENALTY_RATES.p_out_ground) +
    (p.p_skip * PENALTY_RATES.p_skip)
  );
}

function updateScoreSummary(round) {
  const timerObj = round === 'r1' ? r1Timer : r2Timer;
  let rawMs = timerObj ? timerObj.getTimeMs() : 0;
  
  // Check manual override
  const manualToggle = document.getElementById(`${round}-manual-toggle`);
  if (manualToggle && manualToggle.checked) {
    const min = parseInt(document.getElementById(`${round}-manual-min`).value || 0, 10);
    const sec = parseInt(document.getElementById(`${round}-manual-sec`).value || 0, 10);
    const ms = parseInt(document.getElementById(`${round}-manual-ms`).value || 0, 10);
    rawMs = (min * 60 * 1000) + (sec * 1000) + ms;
  }

  const penSeconds = calculateTotalPenaltySeconds(round);
  const penMs = penSeconds * 1000;
  const finalMs = rawMs + penMs;

  const rawEl = document.getElementById(`${round}-calc-raw`);
  const penEl = document.getElementById(`${round}-calc-penalties`);
  const finalEl = document.getElementById(`${round}-calc-final`);

  if (rawEl) rawEl.textContent = formatMsToDisplay(rawMs);
  if (penEl) penEl.textContent = `+${penSeconds.toFixed(2)}s`;
  if (finalEl) finalEl.textContent = formatMsToDisplay(finalMs);

  return { rawMs, penSeconds, finalMs };
}

/**
 * Ranks all submitted runs for a given round based on official rules & tie-breakers:
 * 1. Final Time (Lower is better)
 * 2. Fewer Penalty Seconds
 * 3. Fewer Skipped Obstacles
 */
function getRankedLeaderboard(roundKey) {
  const runs = storeState[roundKey] || {};
  const teamMap = {};
  storeState.teams.forEach(t => { teamMap[t.id] = t; });

  const list = Object.keys(runs).map(teamId => {
    const run = runs[teamId];
    const team = teamMap[teamId] || { name: 'Unknown', id: teamId };
    return {
      teamId,
      teamName: team.name,
      institution: team.institution,
      arena: run.arena || 'A',
      rawTimeMs: run.rawTimeMs,
      penaltySeconds: run.penaltySeconds,
      skippedObstacles: run.penalties ? (run.penalties.p_skip || 0) : 0,
      finalTimeMs: run.finalTimeMs,
      disqualified: run.disqualified,
      dqReason: run.dqReason,
      timestamp: run.timestamp
    };
  });

  // Separate DQ and valid runs
  const validRuns = list.filter(r => !r.disqualified);
  const dqRuns = list.filter(r => r.disqualified);

  // Sort valid runs according to official tie-break order
  validRuns.sort((a, b) => {
    if (a.finalTimeMs !== b.finalTimeMs) {
      return a.finalTimeMs - b.finalTimeMs;
    }
    if (a.penaltySeconds !== b.penaltySeconds) {
      return a.penaltySeconds - b.penaltySeconds;
    }
    if (a.skippedObstacles !== b.skippedObstacles) {
      return a.skippedObstacles - b.skippedObstacles;
    }
    return 0;
  });

  return [...validRuns, ...dqRuns];
}
