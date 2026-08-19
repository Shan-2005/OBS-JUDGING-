/* ==========================================================================
   ROBOFEST 2.0 - PERSONALIZED PARTICIPANT PORTAL & TEAM LOOKUP MODULE
   ========================================================================== */

function searchParticipantTeam(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  return storeState.teams.find(t => 
    t.id.toLowerCase() === q || 
    t.name.toLowerCase().includes(q) || 
    (t.id.toLowerCase().replace('-', '') === q.replace('-', ''))
  );
}

function renderPersonalizedTeamDashboard(teamId) {
  const container = document.getElementById('participant-personalized-card');
  if (!container) return;

  if (!teamId) {
    container.innerHTML = `
      <div class="glass-card text-center p-5">
        <h3>🔍 Search Your Team / Bot ID</h3>
        <p class="text-muted mb-4">Enter your Bot ID (e.g. <code>BOT-001</code>) or Team Name above to view your personalized schedule, timing results, tech check, and next round status.</p>
      </div>
    `;
    return;
  }

  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) {
    container.innerHTML = `
      <div class="glass-card text-center p-5">
        <h3 class="text-warning">⚠️ Team Not Found</h3>
        <p class="text-muted mb-4">No registered team matching "<strong>${teamId}</strong>". Please check your Bot ID.</p>
      </div>
    `;
    return;
  }

  const att = storeState.attendance[team.id] || { status: 'Absent', membersPresent: 0 };
  const r1Run = storeState.round1[team.id];
  const r2Run = storeState.round2[team.id];
  const elig = team.eligibility || {};

  // Calculate Rank in Round 1
  const r1Ranked = getRankedLeaderboard('round1');
  const r1RankObj = r1Ranked.find(r => r.teamId === team.id);
  const r1RankIndex = r1Ranked.findIndex(r => r.teamId === team.id);
  const r1RankStr = r1RankIndex !== -1 ? `#${r1RankIndex + 1} of ${r1Ranked.length}` : 'Pending Run';
  const isTop25 = r1RankIndex !== -1 && r1RankIndex < 25 && !r1Run?.disqualified;

  // Order of Call Queue Position
  const r1Queue = typeof getRound1CallOrder === 'function' ? getRound1CallOrder() : [];
  const myQueueItem = r1Queue.find(q => q.teamId === team.id);

  container.innerHTML = `
    <div class="glass-card full-width personalized-team-card">
      <div class="team-dash-header mb-4">
        <div>
          <span class="badge badge-info">Arena ${team.arena || 'A'} Slot</span>
          <h2 class="mt-1">${team.name} <span class="text-muted">(${team.id})</span></h2>
          <p class="text-muted">${team.institution} — Members: ${(team.members || []).join(', ')}</p>
        </div>
        <div class="text-right">
          <div class="status-pill mb-2">
            ${elig.passed ? '<span class="badge badge-success lg">✅ TECH CHECK PASSED</span>' : '<span class="badge badge-danger lg">❌ TECH CHECK PENDING/FAILED</span>'}
          </div>
          <div>
            ${att.status === 'Present' ? '<span class="badge badge-success">📌 Desk Check-In: PRESENT</span>' : '<span class="badge badge-warning">📌 Desk Check-In: ' + att.status + '</span>'}
          </div>
        </div>
      </div>

      <div class="stats-grid mb-4">
        
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <span class="stat-label">Round 1 Raw Time</span>
            <span class="stat-value">${r1Run ? formatMsToDisplay(r1Run.rawTimeMs) : '--:--.---'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <span class="stat-label">Round 1 Penalties</span>
            <span class="stat-value text-warning">${r1Run ? '+' + r1Run.penaltySeconds + 's' : '+0s'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏎️</div>
          <div class="stat-info">
            <span class="stat-label">Round 1 Final Time</span>
            <span class="stat-value text-cyan">${r1Run ? (r1Run.disqualified ? 'DQ' : formatMsToDisplay(r1Run.finalTimeMs)) : '--:--.---'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🥇</div>
          <div class="stat-info">
            <span class="stat-label">Round 1 Leaderboard Rank</span>
            <span class="stat-value">${r1RankStr}</span>
          </div>
        </div>

      </div>

      <div class="personalized-sections-grid">
        
        <!-- CALL SCHEDULE CARD -->
        <div class="sub-glass-card">
          <h4>📢 Your Call Schedule & Queue Status</h4>
          <div class="mt-3">
            <div class="info-row">
              <span>Current Status:</span>
              <strong class="text-cyan">${myQueueItem ? myQueueItem.status : 'Queued'}</strong>
            </div>
            <div class="info-row">
              <span>Assigned Arena:</span>
              <strong>Arena ${team.arena}</strong>
            </div>
            <div class="info-row">
              <span>Queue Slot #:</span>
              <strong>${myQueueItem ? myQueueItem.slot : '--'}</strong>
            </div>
          </div>
        </div>

        <!-- NEXT ROUND ELIGIBILITY CARD -->
        <div class="sub-glass-card">
          <h4>⚡ Round 2 Qualification Status</h4>
          <div class="mt-3">
            ${isTop25 ? `
              <div class="alert alert-success">
                🎉 <strong>QUALIFIED FOR ROUND 2!</strong> Your team is in the Top 25. Report to the main arena desk.
              </div>
            ` : (r1Run ? `
              <div class="alert alert-warning">
                Rank #${r1RankIndex + 1} — Did not qualify for Round 2 Top 25 cutoff.
              </div>
            ` : `
              <div class="alert alert-info">
                Complete your Round 1 Time Trial run to view qualification results.
              </div>
            `)}
          </div>
        </div>

      </div>
    </div>
  `;
}
