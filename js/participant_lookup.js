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

// Renders the full team list grid for reference (shown in gate popup + page top)
function renderTeamRosterGrid(containerId, filterQuery = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const teams = storeState.teams || [];
  const q = filterQuery.trim().toLowerCase();
  const filtered = q
    ? teams.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    : teams;

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center;padding:12px;">No matching team found.</p>`;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="team-roster-chip" onclick="selectTeamFromRoster('${t.id}', '${t.name.replace(/'/g, "\\'")}')">
      <span class="roster-botid">${t.id}</span>
      <span class="roster-name">${t.name}</span>
      <span class="roster-arena">Arena ${t.arena || 'A'}</span>
    </div>
  `).join('');
}

// Called when user clicks a team chip in the roster
function selectTeamFromRoster(teamId, teamName) {
  // If participant gate is open, fill and submit
  const gateInp = document.getElementById('inp-participant-team-name');
  const gateModal = document.getElementById('modal-participant-gate');
  if (gateModal && !gateModal.classList.contains('hidden')) {
    if (gateInp) gateInp.value = teamName;
    sessionStorage.setItem('participant_team_name', teamName);
    sessionStorage.setItem('participant_team_id', teamId);
    gateModal.classList.add('hidden');
    renderPersonalizedTeamDashboard(teamId);
    return;
  }
  // Otherwise just render the dashboard directly
  const searchInp = document.getElementById('part-team-search-inp');
  if (searchInp) searchInp.value = teamName;
  renderPersonalizedTeamDashboard(teamId);
  // Scroll to dashboard
  const card = document.getElementById('participant-personalized-card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPersonalizedTeamDashboard(teamId) {
  const container = document.getElementById('participant-personalized-card');
  if (!container) return;

  if (!teamId) {
    container.innerHTML = '';
    return;
  }

  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center;padding:32px;">
        <h3 class="text-warning">⚠️ Team Not Found</h3>
        <p class="text-muted mt-2">No registered team matching "<strong>${teamId}</strong>". Check your Bot ID from the list below.</p>
      </div>
    `;
    return;
  }

  const att = storeState.attendance[team.id] || { status: 'Absent', membersPresent: 0 };
  const r1Run = storeState.round1[team.id];
  const r2Run = storeState.round2[team.id];
  const elig = team.eligibility || {};

  // Calculate Rank in Round 1
  const r1Ranked = typeof getRankedLeaderboard === 'function' ? getRankedLeaderboard('round1') : [];
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
          <span class="badge badge-info">Arena ${team.arena || 'A'}</span>
          <h2 class="mt-1">${team.name} <span class="text-muted">(${team.id})</span></h2>
          <p class="text-muted">${team.institution}</p>
        </div>
        <div style="text-align:right;">
          ${elig.passed 
            ? '<span class="badge badge-success lg"><i class="fa-solid fa-circle-check"></i> TECH CHECK PASSED</span>' 
            : '<span class="badge badge-warning lg"><i class="fa-solid fa-circle-notch fa-spin"></i> TECH CHECK PENDING</span>'}
          <br><br>
          ${att.status === 'Present' 
            ? '<span class="badge badge-success"><i class="fa-solid fa-location-dot"></i> CHECK-IN: PRESENT</span>' 
            : `<span class="badge badge-warning"><i class="fa-solid fa-location-dot"></i> CHECK-IN: ${att.status}</span>`}
          <br><br>
          <button onclick="changeParticipantTeam()" class="change-team-link"><i class="fa-solid fa-arrows-rotate"></i> Not your team? Switch</button>
        </div>
      </div>

      <div class="stats-grid mb-4">

        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-stopwatch"></i></div>
          <div class="stat-info">
            <span class="stat-label">R1 Raw Time</span>
            <span class="stat-value">${r1Run ? formatMsToDisplay(r1Run.rawTimeMs) : '--:--.---'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="stat-info">
            <span class="stat-label">R1 Penalties</span>
            <span class="stat-value" style="color:var(--accent-gold)">${r1Run ? '+' + r1Run.penaltySeconds + 's' : '+0s'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-flag-checkered"></i></div>
          <div class="stat-info">
            <span class="stat-label">R1 Final Time</span>
            <span class="stat-value" style="color:var(--primary-cyan)">${r1Run ? (r1Run.disqualified ? 'DQ' : formatMsToDisplay(r1Run.finalTimeMs)) : '--:--.---'}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-trophy"></i></div>
          <div class="stat-info">
            <span class="stat-label">Leaderboard Rank</span>
            <span class="stat-value">${r1RankStr}</span>
          </div>
        </div>

      </div>

      <div class="personalized-sections-grid">

        <div class="sub-glass-card">
          <h4><i class="fa-solid fa-bullhorn"></i> Queue & Call Schedule</h4>
          <div class="mt-3">
            <div class="info-row"><span>Status:</span><strong style="color:var(--primary-cyan)">${myQueueItem ? myQueueItem.status : 'Awaiting Queue'}</strong></div>
            <div class="info-row"><span>Arena:</span><strong>Arena ${team.arena || 'A'}</strong></div>
            <div class="info-row"><span>Queue Slot:</span><strong>${myQueueItem ? '#' + myQueueItem.slot : 'TBA'}</strong></div>
          </div>
        </div>

        <div class="sub-glass-card">
          <h4><i class="fa-solid fa-bolt"></i> Round 2 Qualification</h4>
          <div class="mt-3">
            ${isTop25 ? `
              <div class="alert alert-success"><strong>QUALIFIED FOR ROUND 2!</strong> You are in the Top 25. Report to the main arena desk.</div>
            ` : r1Run ? `
              <div class="alert alert-warning">Rank #${r1RankIndex + 1} — Did not reach the Top 25 cutoff.</div>
            ` : `
              <div class="alert alert-info">Complete your Round 1 time trial run to see your qualification status here.</div>
            `}
          </div>
        </div>

      </div>
    </div>
  `;
}
