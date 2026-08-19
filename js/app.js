/* ==========================================================================
   ROBOFEST 2.0 - MAIN APPLICATION ENTRY POINT & EVENT ROUTER (4-PAGE ENHANCED)
   ========================================================================== */

let r1Timer = null;
let r2Timer = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Timers
  r1Timer = new PrecisionTimer('r1-timer-display');
  r2Timer = new PrecisionTimer('r2-timer-display');

  // Navigation Event Listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSubTab(btn.dataset.sub));
  });

  // Header Actions
  document.getElementById('btn-quick-seed').addEventListener('click', () => {
    if (confirm("Reset and re-seed 58 competition teams?")) {
      seedDefaultTeams();
      refreshAllViews();
      alert("Seeded 58 teams successfully!");
    }
  });

  document.getElementById('btn-print-sheets').addEventListener('click', preparePrintSheets);

  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm("DANGER: Wipe all scores and reset data?")) {
      resetStore();
      refreshAllViews();
    }
  });

  // 1. ATTENDANCE EVENT LISTENERS
  document.getElementById('att-search').addEventListener('input', renderAttendanceTable);
  document.getElementById('att-filter-select').addEventListener('change', renderAttendanceTable);
  document.getElementById('btn-mark-all-present').addEventListener('click', () => {
    storeState.teams.forEach(t => {
      storeState.attendance[t.id] = {
        status: 'Present',
        checkInTime: Date.now(),
        membersPresent: 2,
        notes: 'Marked present via batch'
      };
    });
    saveStore();
    renderAttendanceTable();
    renderDashboardStats();
  });

  // 2. BOT CHECK INSPECTION LISTENERS
  document.getElementById('botcheck-team-select').addEventListener('change', (e) => {
    renderBotCheckInspectorCard(e.target.value);
  });

  // 3. JUDGE MANAGEMENT LISTENERS
  document.getElementById('btn-open-judge-modal').addEventListener('click', () => openJudgeModal());
  document.getElementById('form-judge').addEventListener('submit', handleJudgeFormSubmit);

  // Teams Management Listeners
  document.getElementById('btn-add-team').addEventListener('click', () => openTeamModal());
  document.getElementById('form-team').addEventListener('submit', handleTeamFormSubmit);
  document.getElementById('team-search').addEventListener('input', renderTeamsTable);
  document.getElementById('team-elig-filter').addEventListener('change', renderTeamsTable);

  // Pre-Match Eligibility Form
  document.getElementById('form-eligibility').addEventListener('submit', saveEligibilityForm);

  // Stopwatch R1 Controls
  document.getElementById('r1-btn-start').addEventListener('click', () => {
    r1Timer.start();
    document.getElementById('r1-btn-start').disabled = true;
    document.getElementById('r1-btn-pause').disabled = false;
  });
  document.getElementById('r1-btn-pause').addEventListener('click', () => {
    r1Timer.pause();
    document.getElementById('r1-btn-start').disabled = false;
    document.getElementById('r1-btn-pause').disabled = true;
    updateScoreSummary('r1');
  });
  document.getElementById('r1-btn-reset').addEventListener('click', () => {
    r1Timer.reset();
    document.getElementById('r1-btn-start').disabled = false;
    document.getElementById('r1-btn-pause').disabled = true;
    resetPenaltyCounts('r1');
  });
  document.getElementById('r1-btn-save-run').addEventListener('click', () => submitRunScore('r1'));

  // Stopwatch R2 Controls
  document.getElementById('r2-btn-start').addEventListener('click', () => {
    r2Timer.start();
    document.getElementById('r2-btn-start').disabled = true;
    document.getElementById('r2-btn-pause').disabled = false;
  });
  document.getElementById('r2-btn-pause').addEventListener('click', () => {
    r2Timer.pause();
    document.getElementById('r2-btn-start').disabled = false;
    document.getElementById('r2-btn-pause').disabled = true;
    updateScoreSummary('r2');
  });
  document.getElementById('r2-btn-reset').addEventListener('click', () => {
    r2Timer.reset();
    document.getElementById('r2-btn-start').disabled = false;
    document.getElementById('r2-btn-pause').disabled = true;
    resetPenaltyCounts('r2');
  });
  document.getElementById('r2-btn-save-run').addEventListener('click', () => submitRunScore('r2'));

  // Bracket Sync
  document.getElementById('btn-sync-bracket-seeds').addEventListener('click', syncRound3SeedsFromR2);

  // Modal Close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    });
  });

  // Match decision form submit
  document.getElementById('form-match-result').addEventListener('submit', handleMatchDecisionSubmit);

  // Initial View Render
  refreshAllViews();
});

function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

  const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  const view = document.getElementById(`view-${tabId}`);

  if (btn) btn.classList.add('active');
  if (view) view.classList.add('active');

  if (tabId === 'attendance') renderAttendanceTable();
  if (tabId === 'botcheck') renderBotCheckView();
  if (tabId === 'judges') renderJudgesTable();
  if (tabId === 'teams') renderTeamsTable();
  if (tabId === 'round3') renderBracket();
  if (tabId === 'leaderboard') renderLeaderboards();
  if (tabId === 'participants') renderParticipantsView();
}

function switchSubTab(subId) {
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));

  const btn = document.querySelector(`.sub-tab-btn[data-sub="${subId}"]`);
  const view = document.getElementById(subId);

  if (btn) btn.classList.add('active');
  if (view) view.classList.add('active');
}

function refreshAllViews() {
  renderDashboardStats();
  renderAttendanceTable();
  renderBotCheckView();
  renderJudgesTable();
  renderTeamsTable();
  populateScoringTeamSelects();
  populateJudgeSelectDropdowns();
  renderSubmittedRuns('r1');
  renderSubmittedRuns('r2');
  renderBracket();
  renderLeaderboards();
  renderParticipantsView();
}

function renderDashboardStats() {
  const total = storeState.teams.length;
  const present = Object.values(storeState.attendance || {}).filter(a => a.status === 'Present' || a.status === 'Late').length;
  const eligible = storeState.teams.filter(t => t.eligibility && t.eligibility.passed).length;
  const judgesCount = (storeState.judges || []).length;

  document.getElementById('dash-total-teams').textContent = total;
  document.getElementById('dash-present-teams').textContent = `${present} / ${total}`;
  document.getElementById('dash-eligible-teams').textContent = `${eligible} / ${total}`;
  document.getElementById('dash-judges-count').textContent = judgesCount;
}

/* ==========================================================================
   1. ATTENDANCE PAGE MODULE
   ========================================================================== */

function renderAttendanceTable() {
  const tbody = document.getElementById('att-tbody');
  if (!tbody) return;

  const query = document.getElementById('att-search').value.toLowerCase();
  const filter = document.getElementById('att-filter-select').value;

  const filtered = storeState.teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(query) ||
                          t.id.toLowerCase().includes(query) ||
                          t.institution.toLowerCase().includes(query);

    const att = storeState.attendance[t.id] || { status: 'Absent' };
    if (filter !== 'all' && att.status !== filter) return false;
    return matchesSearch;
  });

  tbody.innerHTML = filtered.map(t => {
    const att = storeState.attendance[t.id] || { status: 'Absent', checkInTime: null, membersPresent: 0 };
    
    let statusBadge = `<span class="badge badge-danger">ABSENT</span>`;
    if (att.status === 'Present') statusBadge = `<span class="badge badge-success">PRESENT</span>`;
    if (att.status === 'Late') statusBadge = `<span class="badge badge-warning">LATE</span>`;

    const timeStr = att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return `
      <tr>
        <td><strong>${t.id}</strong></td>
        <td>${t.name}</td>
        <td>${t.institution}</td>
        <td><span class="badge badge-info">Arena ${t.arena || 'A'}</span></td>
        <td>
          <input type="number" min="0" max="4" value="${att.membersPresent}" class="num-input sm" onchange="updateAttendanceMembers('${t.id}', this.value)">
        </td>
        <td>${statusBadge}</td>
        <td>${timeStr}</td>
        <td>
          <select class="form-select sm" onchange="updateAttendanceStatus('${t.id}', this.value)">
            <option value="Present" ${att.status === 'Present' ? 'selected' : ''}>Present</option>
            <option value="Late" ${att.status === 'Late' ? 'selected' : ''}>Late</option>
            <option value="Absent" ${att.status === 'Absent' ? 'selected' : ''}>Absent</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

function updateAttendanceStatus(teamId, status) {
  if (!storeState.attendance[teamId]) {
    storeState.attendance[teamId] = { status: 'Absent', checkInTime: null, membersPresent: 0, notes: '' };
  }
  storeState.attendance[teamId].status = status;
  storeState.attendance[teamId].checkInTime = status !== 'Absent' ? Date.now() : null;
  saveStore();
  renderAttendanceTable();
  renderDashboardStats();
}

function updateAttendanceMembers(teamId, count) {
  if (!storeState.attendance[teamId]) {
    storeState.attendance[teamId] = { status: 'Present', checkInTime: Date.now(), membersPresent: parseInt(count, 10), notes: '' };
  }
  storeState.attendance[teamId].membersPresent = parseInt(count, 10);
  saveStore();
}

/* ==========================================================================
   2. BOT CHECK PAGE MODULE
   ========================================================================== */

function renderBotCheckView() {
  const select = document.getElementById('botcheck-team-select');
  if (select) {
    select.innerHTML = `<option value="">-- Choose Team to Inspect --</option>` +
      storeState.teams.map(t => {
        const passed = t.eligibility && t.eligibility.passed;
        const icon = passed ? '✅' : '⏳';
        return `<option value="${t.id}">${icon} ${t.id} — ${t.name} (${t.institution})</option>`;
      }).join('');
  }

  renderBotCheckLogTable();
}

function renderBotCheckInspectorCard(teamId) {
  const container = document.getElementById('botcheck-inspector-card');
  if (!container) return;

  if (!teamId) {
    container.innerHTML = `<p class="text-muted text-center">Select a team above to start technical inspection.</p>`;
    return;
  }

  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) return;

  const elig = team.eligibility || {};

  container.innerHTML = `
    <div class="inspector-header mb-3">
      <h4>Inspection Certificate for ${team.id} (${team.name})</h4>
      <span class="badge ${elig.passed ? 'badge-success' : 'badge-danger'}">
        ${elig.passed ? 'VERIFIED PASSED' : 'INSPECTION PENDING / FAILED'}
      </span>
    </div>

    <div class="tech-checklist-preview mb-3">
      <div class="checklist-grid">
        ${renderTechCheckItem('Dimensions (≤30x30x30 cm)', elig.dimensions)}
        ${renderTechCheckItem('Weight (≤5 kg)', elig.weight)}
        ${renderTechCheckItem('Voltage (≤16.8 V)', elig.voltage)}
        ${renderTechCheckItem('Drive Type (2WD/4WD)', elig.driveType)}
        ${renderTechCheckItem('Body Origin (No toys)', elig.bodyOrigin)}
        ${renderTechCheckItem('Wired Control (≥4m cable)', elig.wiredControl)}
        ${renderTechCheckItem('Wireless Control (Dual freq)', elig.wirelessControl)}
        ${renderTechCheckItem('Banned Parts (No LEGO/IC)', elig.bannedParts)}
        ${renderTechCheckItem('Team (Max 4, ID carried)', elig.teamMembers)}
        ${renderTechCheckItem('Dedicated Tx/Rx Set', elig.dedicatedTxRx)}
      </div>
    </div>

    <div class="actions mt-3 text-right">
      <button class="btn btn-primary lg" onclick="openEligibilityModal('${team.id}')">
        📋 Edit Tech Inspection Form
      </button>
    </div>
  `;
}

function renderTechCheckItem(label, passed) {
  return `
    <div class="checklist-item">
      <span>${label}</span>
      <span class="badge ${passed ? 'badge-success' : 'badge-danger'}">${passed ? 'PASS' : 'FAIL'}</span>
    </div>
  `;
}

function renderBotCheckLogTable() {
  const tbody = document.getElementById('botcheck-log-tbody');
  if (!tbody) return;

  tbody.innerHTML = storeState.teams.map(t => {
    const passed = t.eligibility && t.eligibility.passed;
    return `
      <tr>
        <td><strong>${t.id}</strong></td>
        <td>${t.name}</td>
        <td>
          <span class="badge ${passed ? 'badge-success' : 'badge-danger'}">
            ${passed ? 'PASSED' : 'PENDING'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline sm" onclick="openEligibilityModal('${t.id}')">Inspect</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   3. JUDGES ADD & MANAGEMENT PAGE MODULE
   ========================================================================== */

function renderJudgesTable() {
  const tbody = document.getElementById('judges-tbody');
  if (!tbody) return;

  const judges = storeState.judges || [];
  tbody.innerHTML = judges.map(j => `
    <tr>
      <td><strong>${j.id}</strong></td>
      <td>${j.name}</td>
      <td><span class="badge badge-info">${j.role}</span></td>
      <td><span class="badge badge-success">Arena ${j.assignedArena}</span></td>
      <td>${j.phone || '--'}</td>
      <td>
        <button class="btn btn-outline sm" onclick="openJudgeModal('${j.id}')">✏️ Edit</button>
        <button class="btn btn-danger-ghost sm" onclick="deleteJudge('${j.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openJudgeModal(judgeId = null) {
  const modal = document.getElementById('modal-judge');
  const title = document.getElementById('modal-judge-title');
  const hiddenId = document.getElementById('judge-id-hidden');

  if (judgeId) {
    const judge = (storeState.judges || []).find(j => j.id === judgeId);
    if (!judge) return;
    title.textContent = "Edit Judge Details";
    hiddenId.value = judge.id;
    document.getElementById('inp-judge-name').value = judge.name;
    document.getElementById('inp-judge-role').value = judge.role;
    document.getElementById('inp-judge-arena').value = judge.assignedArena;
    document.getElementById('inp-judge-phone').value = judge.phone || '';
  } else {
    title.textContent = "Add New Officiating Judge";
    hiddenId.value = "";
    document.getElementById('inp-judge-name').value = "";
    document.getElementById('inp-judge-role').value = "Head Referee";
    document.getElementById('inp-judge-arena').value = "A";
    document.getElementById('inp-judge-phone').value = "";
  }

  modal.classList.remove('hidden');
}

function handleJudgeFormSubmit(e) {
  e.preventDefault();
  const hiddenId = document.getElementById('judge-id-hidden').value;
  const name = document.getElementById('inp-judge-name').value.trim();
  const role = document.getElementById('inp-judge-role').value;
  const arena = document.getElementById('inp-judge-arena').value;
  const phone = document.getElementById('inp-judge-phone').value.trim();

  if (!storeState.judges) storeState.judges = [];

  if (hiddenId) {
    const judge = storeState.judges.find(j => j.id === hiddenId);
    if (judge) {
      judge.name = name;
      judge.role = role;
      judge.assignedArena = arena;
      judge.phone = phone;
    }
  } else {
    const newId = `J-00${storeState.judges.length + 1}`;
    storeState.judges.push({ id: newId, name, role, assignedArena: arena, phone });
  }

  saveStore();
  document.getElementById('modal-judge').classList.add('hidden');
  renderJudgesTable();
  renderDashboardStats();
  populateJudgeSelectDropdowns();
}

function deleteJudge(judgeId) {
  if (confirm("Are you sure you want to remove this judge?")) {
    storeState.judges = storeState.judges.filter(j => j.id !== judgeId);
    saveStore();
    renderJudgesTable();
    renderDashboardStats();
    populateJudgeSelectDropdowns();
  }
}

function populateJudgeSelectDropdowns() {
  const r1Select = document.getElementById('r1-judge-name');
  const r2Select = document.getElementById('r2-judge-name');
  const judges = storeState.judges || [];

  const options = `<option value="">-- Select Officiating Judge --</option>` +
    judges.map(j => `<option value="${j.name}">${j.name} (${j.role} - Arena ${j.assignedArena})</option>`).join('');

  if (r1Select) r1Select.innerHTML = options;
  if (r2Select) r2Select.innerHTML = options;
}

/* ==========================================================================
   4. PARTICIPANTS VIEWING PAGE (SPECTATOR LIVE DISPLAY)
   ========================================================================== */

function renderParticipantsView() {
  const arenaAList = document.getElementById('part-arenaA-list');
  const arenaBList = document.getElementById('part-arenaB-list');

  const arenaATeams = storeState.teams.filter(t => t.arena === 'A');
  const arenaBTeams = storeState.teams.filter(t => t.arena === 'B');

  if (arenaAList) {
    arenaAList.innerHTML = arenaATeams.map(t => {
      const run = storeState.round1[t.id];
      const timeStr = run ? (run.disqualified ? 'DQ' : formatMsToDisplay(run.finalTimeMs)) : 'Scheduled';
      return `
        <div class="schedule-card ${run ? 'active-run' : ''}">
          <div>
            <strong>${t.id}</strong> — ${t.name} (${t.institution})
          </div>
          <span class="badge ${run ? 'badge-success' : 'badge-info'}">${timeStr}</span>
        </div>
      `;
    }).join('');
  }

  if (arenaBList) {
    arenaBList.innerHTML = arenaBTeams.map(t => {
      const run = storeState.round1[t.id];
      const timeStr = run ? (run.disqualified ? 'DQ' : formatMsToDisplay(run.finalTimeMs)) : 'Scheduled';
      return `
        <div class="schedule-card ${run ? 'active-run' : ''}">
          <div>
            <strong>${t.id}</strong> — ${t.name} (${t.institution})
          </div>
          <span class="badge ${run ? 'badge-success' : 'badge-info'}">${timeStr}</span>
        </div>
      `;
    }).join('');
  }

  const standingsTbody = document.getElementById('part-standings-tbody');
  if (standingsTbody) {
    const r1List = getRankedLeaderboard('round1');
    standingsTbody.innerHTML = r1List.slice(0, 25).map((r, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${r.teamId}</strong></td>
        <td>${r.teamName}</td>
        <td>${r.institution}</td>
        <td><span class="badge badge-info">Arena ${r.arena}</span></td>
        <td class="text-cyan"><strong>${formatMsToDisplay(r.finalTimeMs)}</strong></td>
        <td><span class="badge badge-success">TOP 25 QUALIFIED</span></td>
      </tr>
    `).join('');
  }
}

/* ==========================================================================
   STANDARD TEAMS, SCORING & BRACKET RENDERERS
   ========================================================================== */

function renderTeamsTable() {
  const tbody = document.getElementById('teams-tbody');
  if (!tbody) return;

  const query = document.getElementById('team-search').value.toLowerCase();
  const filter = document.getElementById('team-elig-filter').value;

  const filtered = storeState.teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(query) ||
                          t.id.toLowerCase().includes(query) ||
                          t.institution.toLowerCase().includes(query);

    const isPassed = t.eligibility && t.eligibility.passed;
    const isPending = !t.eligibility || (!t.eligibility.passed && (!t.eligibility.notes || t.eligibility.notes.includes("Pending")));
    const isFailed = t.eligibility && !t.eligibility.passed && !isPending;

    if (filter === 'passed') return matchesSearch && isPassed;
    if (filter === 'pending') return matchesSearch && isPending;
    if (filter === 'failed') return matchesSearch && isFailed;
    return matchesSearch;
  });

  tbody.innerHTML = filtered.map(t => {
    const isPassed = t.eligibility && t.eligibility.passed;
    const statusBadge = isPassed
      ? `<span class="badge badge-success">VERIFIED PASSED</span>`
      : `<span class="badge badge-danger">ELIGIBILITY FAILED</span>`;

    return `
      <tr>
        <td><strong>${t.id}</strong></td>
        <td>${t.name}</td>
        <td>${t.institution}</td>
        <td><span class="badge badge-info">Arena ${t.arena || 'A'}</span></td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-outline sm" onclick="openEligibilityModal('${t.id}')">📋 Check</button>
          <button class="btn btn-outline sm" onclick="openTeamModal('${t.id}')">✏️ Edit</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openTeamModal(teamId = null) {
  const modal = document.getElementById('modal-team');
  const title = document.getElementById('modal-team-title');
  const hiddenId = document.getElementById('team-id-hidden');

  if (teamId) {
    const team = storeState.teams.find(t => t.id === teamId);
    if (!team) return;
    title.textContent = "Edit Team";
    hiddenId.value = team.id;
    document.getElementById('inp-bot-id').value = team.id;
    document.getElementById('inp-bot-id').readOnly = true;
    document.getElementById('inp-team-name').value = team.name;
    document.getElementById('inp-institution').value = team.institution;
    document.getElementById('inp-members').value = (team.members || []).join(', ');
    document.getElementById('inp-arena').value = team.arena || 'A';
  } else {
    title.textContent = "Add New Team";
    hiddenId.value = "";
    document.getElementById('inp-bot-id').value = `BOT-${String(storeState.teams.length + 1).padStart(3, '0')}`;
    document.getElementById('inp-bot-id').readOnly = false;
    document.getElementById('inp-team-name').value = "";
    document.getElementById('inp-institution').value = "";
    document.getElementById('inp-members').value = "";
    document.getElementById('inp-arena').value = "A";
  }

  modal.classList.remove('hidden');
}

function handleTeamFormSubmit(e) {
  e.preventDefault();
  const hiddenId = document.getElementById('team-id-hidden').value;
  const botId = document.getElementById('inp-bot-id').value.trim();
  const name = document.getElementById('inp-team-name').value.trim();
  const institution = document.getElementById('inp-institution').value.trim();
  const members = document.getElementById('inp-members').value.split(',').map(s => s.trim());
  const arena = document.getElementById('inp-arena').value;

  if (hiddenId) {
    const team = storeState.teams.find(t => t.id === hiddenId);
    if (team) {
      team.name = name;
      team.institution = institution;
      team.members = members;
      team.arena = arena;
    }
  } else {
    storeState.teams.push({
      id: botId,
      name,
      institution,
      members,
      arena,
      eligibility: { passed: false, notes: "Pending pre-match check" }
    });
  }

  saveStore();
  document.getElementById('modal-team').classList.add('hidden');
  refreshAllViews();
}

function populateScoringTeamSelects() {
  const r1Select = document.getElementById('r1-team-select');
  const r2Select = document.getElementById('r2-team-select');

  const eligible = storeState.teams.filter(t => t.eligibility && t.eligibility.passed);
  if (r1Select) {
    r1Select.innerHTML = `<option value="">-- Select Eligible Team --</option>` +
      eligible.map(t => `<option value="${t.id}">${t.id} — ${t.name} (${t.institution}) [Arena ${t.arena}]</option>`).join('');
  }

  const r1Ranked = getRankedLeaderboard('round1');
  const top25 = r1Ranked.filter(r => !r.disqualified).slice(0, 25);
  if (r2Select) {
    r2Select.innerHTML = `<option value="">-- Select R2 Qualified Team (Top 25) --</option>` +
      top25.map((r, i) => `<option value="${r.teamId}">#${i+1} ${r.teamId} — ${r.teamName}</option>`).join('');
  }
}

function submitRunScore(round) {
  const teamSelectId = `${round}-team-select`;
  const teamId = document.getElementById(teamSelectId).value;

  if (!teamId) {
    alert("Please select a team before submitting score.");
    return;
  }

  const { rawMs, penSeconds, finalMs } = updateScoreSummary(round);
  const timerObj = round === 'r1' ? r1Timer : r2Timer;

  if (rawMs === 0) {
    if (!confirm("Raw time is 00:00.000. Do you want to submit anyway?")) return;
  }

  const isDq = document.getElementById(`${round}-is-dq`).checked;
  const dqReason = document.getElementById(`${round}-dq-reason`).value || "";
  const judgeName = document.getElementById(`${round}-judge-name`).value || "Head Referee";
  const arena = round === 'r1' ? document.getElementById('r1-arena-select').value : 'HARD_ARENA';

  const runRecord = {
    rawTimeMs: rawMs,
    penalties: { ...currentPenalties[round] },
    penaltySeconds: penSeconds,
    finalTimeMs: isDq ? 9999999 : finalMs,
    disqualified: isDq,
    dqReason: dqReason,
    arena: arena,
    judgeName: judgeName,
    timestamp: Date.now()
  };

  const storeKey = round === 'r1' ? 'round1' : 'round2';
  storeState[storeKey][teamId] = runRecord;
  saveStore();

  timerObj.reset();
  resetPenaltyCounts(round);
  document.getElementById(`${round}-is-dq`).checked = false;
  document.getElementById(`${round}-dq-reason`).value = "";

  renderSubmittedRuns(round);
  renderDashboardStats();
  populateScoringTeamSelects();
  renderLeaderboards();
  renderParticipantsView();

  alert(`Score saved for ${teamId}! Final Time: ${formatMsToDisplay(finalMs)}`);
}

function renderSubmittedRuns(round) {
  const tbody = document.getElementById(`${round}-runs-tbody`);
  if (!tbody) return;

  const storeKey = round === 'r1' ? 'round1' : 'round2';
  const runs = storeState[storeKey] || {};

  const keys = Object.keys(runs);
  if (keys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center">No runs submitted yet</td></tr>`;
    return;
  }

  tbody.innerHTML = keys.map(teamId => {
    const r = runs[teamId];
    const finalDisp = r.disqualified ? `<span class="badge badge-danger">DQ</span>` : formatMsToDisplay(r.finalTimeMs);
    return `
      <tr>
        <td><strong>${teamId}</strong></td>
        ${round === 'r1' ? `<td><span class="badge badge-info">${r.arena}</span></td>` : ''}
        <td>${formatMsToDisplay(r.rawTimeMs)}</td>
        <td class="text-warning">+${r.penaltySeconds}s</td>
        <td><strong>${finalDisp}</strong></td>
      </tr>
    `;
  }).join('');
}

function renderLeaderboards() {
  const r1List = getRankedLeaderboard('round1');
  const r1Tbody = document.getElementById('r1-leaderboard-tbody');
  if (r1Tbody) {
    r1Tbody.innerHTML = r1List.map((r, idx) => {
      const isTop25 = idx < 25 && !r.disqualified;
      const statusBadge = r.disqualified
        ? `<span class="badge badge-danger">DQ: ${r.dqReason || 'Disqualified'}</span>`
        : isTop25
          ? `<span class="badge badge-success">QUALIFIED (R2)</span>`
          : `<span class="badge badge-warning">ELIMINATED</span>`;

      return `
        <tr class="${isTop25 ? 'highlight-qualified' : ''}">
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${r.teamId}</strong></td>
          <td>${r.teamName}</td>
          <td><span class="badge badge-info">Arena ${r.arena}</span></td>
          <td>${formatMsToDisplay(r.rawTimeMs)}</td>
          <td class="text-warning">+${r.penaltySeconds.toFixed(2)}s</td>
          <td class="text-cyan"><strong>${formatMsToDisplay(r.finalTimeMs)}</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  const r2List = getRankedLeaderboard('round2');
  const r2Tbody = document.getElementById('r2-leaderboard-tbody');
  if (r2Tbody) {
    r2Tbody.innerHTML = r2List.map((r, idx) => {
      const isTop9 = idx < 9 && !r.disqualified;
      const statusBadge = r.disqualified
        ? `<span class="badge badge-danger">DQ: ${r.dqReason || 'Disqualified'}</span>`
        : isTop9
          ? `<span class="badge badge-success">SEED #${idx + 1} (ROUND 3)</span>`
          : `<span class="badge badge-warning">ELIMINATED</span>`;

      return `
        <tr class="${isTop9 ? 'highlight-qualified' : ''}">
          <td><strong>Seed #${idx + 1}</strong></td>
          <td><strong>${r.teamId}</strong></td>
          <td>${r.teamName}</td>
          <td>${formatMsToDisplay(r.rawTimeMs)}</td>
          <td class="text-warning">+${r.penaltySeconds.toFixed(2)}s</td>
          <td class="text-cyan"><strong>${formatMsToDisplay(r.finalTimeMs)}</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  const podium = document.getElementById('r3-podium');
  if (podium) {
    const m = storeState.round3.matches;
    const champ = getTeamDisplayName(m.M9.winner);
    const runnerUp = getTeamDisplayName(getMatchLoser('M9'));
    const third = getTeamDisplayName(m.M8.winner);
    const fourth = getTeamDisplayName(getMatchLoser('M8'));

    podium.innerHTML = `
      <div class="podium-grid">
        <div class="podium-card champion">
          <div class="podium-rank">🥇 1ST PLACE CHAMPION</div>
          <h3>${champ}</h3>
        </div>
        <div class="podium-card runner">
          <div class="podium-rank">🥈 2ND PLACE</div>
          <h3>${runnerUp}</h3>
        </div>
        <div class="podium-card third">
          <div class="podium-rank">🥉 3RD PLACE</div>
          <h3>${third}</h3>
        </div>
        <div class="podium-card fourth">
          <div class="podium-rank">4TH PLACE</div>
          <h3>${fourth}</h3>
        </div>
      </div>
    `;
  }
}

function openMatchDecisionModal(matchId) {
  const match = storeState.round3.matches[matchId];
  if (!match) return;

  document.getElementById('r3-match-id').value = matchId;
  document.getElementById('r3-modal-match-title').textContent = `${match.id} Decision — ${match.stage}`;

  document.getElementById('r3-teamA-name').textContent = getTeamDisplayName(match.teamA);
  document.getElementById('r3-teamB-name').textContent = getTeamDisplayName(match.teamB);

  document.getElementById('r3-selected-winner-id').value = match.winner || "";
  document.getElementById('r3-winner-display-name').value = match.winner ? getTeamDisplayName(match.winner) : "";

  document.getElementById('modal-match-judge').classList.remove('hidden');
}

function selectMatchWinner(slot) {
  const matchId = document.getElementById('r3-match-id').value;
  const match = storeState.round3.matches[matchId];
  if (!match) return;

  const winnerId = slot === 'A' ? match.teamA : match.teamB;
  if (!winnerId) {
    alert("Cannot select empty team slot!");
    return;
  }

  document.getElementById('r3-selected-winner-id').value = winnerId;
  document.getElementById('r3-winner-display-name').value = getTeamDisplayName(winnerId);
}

function handleMatchDecisionSubmit(e) {
  e.preventDefault();
  const matchId = document.getElementById('r3-match-id').value;
  const winnerId = document.getElementById('r3-selected-winner-id').value;
  const reason = document.getElementById('r3-win-reason').value;

  if (!winnerId) {
    alert("Please select a winner first!");
    return;
  }

  const match = storeState.round3.matches[matchId];
  if (match) {
    match.winner = winnerId;
    match.reason = reason;
  }

  saveStore();
  renderBracket();
  renderLeaderboards();
  renderParticipantsView();
  document.getElementById('modal-match-judge').classList.add('hidden');
}
