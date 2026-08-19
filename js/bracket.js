/* ==========================================================================
   ROBOFEST 2.0 - ROUND 3 KNOCKOUT BRACKET & ADVANCEMENT ENGINE
   ========================================================================== */

function syncRound3SeedsFromR2() {
  const r2Ranked = getRankedLeaderboard('round2');
  const validRanked = r2Ranked.filter(r => !r.disqualified);
  
  if (validRanked.length < 9) {
    alert(`Notice: Only ${validRanked.length} teams have valid Round 2 runs. Seeding requires top 9.`);
  }

  // Populate seeds 1 to 9
  const seeds = {};
  for (let i = 1; i <= 9; i++) {
    if (validRanked[i - 1]) {
      seeds[i] = validRanked[i - 1].teamId;
    } else {
      seeds[i] = `SEED_${i}_TBD`;
    }
  }

  const matches = storeState.round3.matches;
  
  // Set initial bracket matchups
  matches.M1.teamA = seeds[8];
  matches.M1.teamB = seeds[9];
  
  matches.M2.teamA = seeds[1];
  matches.M2.teamB = matches.M1.winner || "Winner M1";

  matches.M3.teamA = seeds[4];
  matches.M3.teamB = seeds[5];

  matches.M4.teamA = seeds[3];
  matches.M4.teamB = seeds[6];

  matches.M5.teamA = seeds[2];
  matches.M5.teamB = seeds[7];

  saveStore();
  renderBracket();
}

function updateBracketAdvancement() {
  const m = storeState.round3.matches;

  // M1 Winner -> M2 Team B
  if (m.M1.winner) m.M2.teamB = m.M1.winner;

  // QF Winners -> SF Team A/B
  if (m.M2.winner) m.M6.teamA = m.M2.winner;
  if (m.M3.winner) m.M6.teamB = m.M3.winner;

  if (m.M4.winner) m.M7.teamA = m.M4.winner;
  if (m.M5.winner) m.M7.teamB = m.M5.winner;

  // SF Winners -> Final (M9) & SF Losers -> 3rd Place Match (M8)
  if (m.M6.winner) {
    m.M9.teamA = m.M6.winner;
    m.M8.teamA = getMatchLoser('M6');
  }
  if (m.M7.winner) {
    m.M9.teamB = m.M7.winner;
    m.M8.teamB = getMatchLoser('M7');
  }

  saveStore();
}

function getMatchLoser(matchId) {
  const match = storeState.round3.matches[matchId];
  if (!match || !match.winner) return null;
  return match.winner === match.teamA ? match.teamB : match.teamA;
}

function getTeamDisplayName(teamId) {
  if (!teamId) return "TBD";
  const team = storeState.teams.find(t => t.id === teamId);
  return team ? `${team.id} (${team.name})` : teamId;
}

function renderBracket() {
  const container = document.getElementById('bracket-render');
  if (!container) return;

  updateBracketAdvancement();
  const m = storeState.round3.matches;

  const html = `
    <!-- COL 1: PLAY-IN -->
    <div class="bracket-column">
      <div class="bracket-col-title">PLAY-IN MATCH</div>
      ${renderMatchCard(m.M1)}
    </div>

    <!-- COL 2: QUARTERFINALS -->
    <div class="bracket-column">
      <div class="bracket-col-title">QUARTERFINALS</div>
      ${renderMatchCard(m.M2)}
      ${renderMatchCard(m.M3)}
      ${renderMatchCard(m.M4)}
      ${renderMatchCard(m.M5)}
    </div>

    <!-- COL 3: SEMIFINALS -->
    <div class="bracket-column">
      <div class="bracket-col-title">SEMIFINALS</div>
      ${renderMatchCard(m.M6)}
      ${renderMatchCard(m.M7)}
    </div>

    <!-- COL 4: FINALS & 3RD PLACE -->
    <div class="bracket-column">
      <div class="bracket-col-title">3RD PLACE & FINAL</div>
      ${renderMatchCard(m.M8, "🥉 3rd Place Match")}
      ${renderMatchCard(m.M9, "🏆 GRAND FINAL")}
    </div>
  `;

  container.innerHTML = html;
}

function renderMatchCard(match, customTitle = null) {
  const title = customTitle || `${match.id} — ${match.stage}`;
  const teamAName = getTeamDisplayName(match.teamA);
  const teamBName = getTeamDisplayName(match.teamB);

  const isWinnerA = match.winner && match.winner === match.teamA;
  const isWinnerB = match.winner && match.winner === match.teamB;

  return `
    <div class="match-card" onclick="openMatchDecisionModal('${match.id}')">
      <div class="match-header">
        <span>${title}</span>
        <span>${match.winner ? "✅ DONE" : "⏳ PENDING"}</span>
      </div>
      <div class="match-slot ${isWinnerA ? 'winner' : ''}">
        <span>${teamAName}</span>
        <span>${isWinnerA ? 'WINNER' : ''}</span>
      </div>
      <div class="match-slot ${isWinnerB ? 'winner' : ''}">
        <span>${teamBName}</span>
        <span>${isWinnerB ? 'WINNER' : ''}</span>
      </div>
    </div>
  `;
}
