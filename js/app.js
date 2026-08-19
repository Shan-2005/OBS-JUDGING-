/* ==========================================================================
   ROBOFEST 2.0 - MAIN APPLICATION ENTRY POINT & EVENT ROUTER (4-PAGE ENHANCED)
   ========================================================================== */

let r1Timer = null;
let r2Timer = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Timers
  if (typeof PrecisionTimer === 'function') {
    r1Timer = new PrecisionTimer('r1-timer-display');
    r2Timer = new PrecisionTimer('r2-timer-display');
  }

  // Safe Listener Helper
  const safeListen = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  // Navigation Event Listeners (Top tabs & Mobile bottom dock)
  document.querySelectorAll('.nav-btn, .dock-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSubTab(btn.dataset.sub));
  });

  // Header Actions
  safeListen('btn-print-sheets', 'click', preparePrintSheets);

  safeListen('btn-reset-data', 'click', () => {
    if (confirm("DANGER: Wipe all scores and reset data?")) {
      resetStore();
      refreshAllViews();
    }
  });

  // 1. ATTENDANCE EVENT LISTENERS
  safeListen('att-search', 'input', renderAttendanceTable);
  safeListen('att-filter-select', 'change', renderAttendanceTable);
  safeListen('btn-mark-all-present', 'click', () => {
    storeState.teams.forEach(t => {
      const rSize = t.rosterSize || 1;
      storeState.attendance[t.id] = {
        status: 'Present',
        checkInTime: Date.now(),
        membersPresent: rSize,
        maxMembers: rSize,
        notes: 'Marked present via batch'
      };
    });
    saveStore();
    renderAttendanceTable();
    renderDashboardStats();
  });

  safeListen('btn-mark-all-absent', 'click', () => {
    if (confirm("Reset attendance status to ABSENT for all 58 teams?")) {
      storeState.attendance = {};
      saveStore();
      renderAttendanceTable();
      renderDashboardStats();
    }
  });

  // 2. BOT CHECK INSPECTION LISTENERS
  safeListen('botcheck-team-select', 'change', (e) => {
    renderBotCheckInspectorCard(e.target.value);
  });
  safeListen('botcheck-round-select', 'change', () => {
    renderBotCheckView();
    const selectEl = document.getElementById('botcheck-team-select');
    const selVal = selectEl ? selectEl.value : '';
    renderBotCheckInspectorCard(selVal);
  });

  // 3. JUDGE MANAGEMENT LISTENERS
  safeListen('btn-open-judge-modal', 'click', () => openJudgeModal());
  safeListen('form-judge', 'submit', handleJudgeFormSubmit);

  // Teams Management Listeners
  safeListen('btn-add-team', 'click', () => openTeamModal());
  safeListen('form-team', 'submit', handleTeamFormSubmit);
  safeListen('team-search', 'input', renderTeamsTable);
  safeListen('team-elig-filter', 'change', renderTeamsTable);

  // Pre-Match Eligibility Form
  safeListen('form-eligibility', 'submit', saveEligibilityForm);

  // Stopwatch R1 Controls
  safeListen('r1-btn-start', 'click', () => {
    if (r1Timer) r1Timer.start();
    const btnS = document.getElementById('r1-btn-start');
    const btnP = document.getElementById('r1-btn-pause');
    if (btnS) btnS.disabled = true;
    if (btnP) btnP.disabled = false;
  });
  safeListen('r1-btn-pause', 'click', () => {
    if (r1Timer) r1Timer.pause();
    const btnS = document.getElementById('r1-btn-start');
    const btnP = document.getElementById('r1-btn-pause');
    if (btnS) btnS.disabled = false;
    if (btnP) btnP.disabled = true;
    updateScoreSummary('r1');
  });
  safeListen('r1-btn-reset', 'click', () => {
    if (r1Timer) r1Timer.reset();
    const btnS = document.getElementById('r1-btn-start');
    const btnP = document.getElementById('r1-btn-pause');
    if (btnS) btnS.disabled = false;
    if (btnP) btnP.disabled = true;
    resetPenaltyCounts('r1');
  });
  safeListen('r1-btn-save-run', 'click', () => submitRunScore('r1'));

  // Stopwatch R2 Controls
  safeListen('r2-btn-start', 'click', () => {
    if (r2Timer) r2Timer.start();
    const btnS = document.getElementById('r2-btn-start');
    const btnP = document.getElementById('r2-btn-pause');
    if (btnS) btnS.disabled = true;
    if (btnP) btnP.disabled = false;
  });
  safeListen('r2-btn-pause', 'click', () => {
    if (r2Timer) r2Timer.pause();
    const btnS = document.getElementById('r2-btn-start');
    const btnP = document.getElementById('r2-btn-pause');
    if (btnS) btnS.disabled = false;
    if (btnP) btnP.disabled = true;
    updateScoreSummary('r2');
  });
  safeListen('r2-btn-reset', 'click', () => {
    if (r2Timer) r2Timer.reset();
    const btnS = document.getElementById('r2-btn-start');
    const btnP = document.getElementById('r2-btn-pause');
    if (btnS) btnS.disabled = false;
    if (btnP) btnP.disabled = true;
    resetPenaltyCounts('r2');
  });
  safeListen('r2-btn-save-run', 'click', () => submitRunScore('r2'));

  // Bracket Sync
  safeListen('btn-sync-bracket-seeds', 'click', syncRound3SeedsFromR2);

  // Modal Close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.add('hidden');
        m.style.display = 'none';
      });
    });
  });

  // Match decision form submit
  safeListen('form-match-result', 'submit', handleMatchDecisionSubmit);

  // Participant Search Handler
  const btnPartSearch = document.getElementById('btn-part-search-team');
  const inpPartSearch = document.getElementById('part-team-search-inp');
  if (inpPartSearch) {
    const doLookup = () => {
      const q = inpPartSearch.value.trim();
      if (!q) return;
      if (typeof searchParticipantTeam === 'function' && typeof renderPersonalizedTeamDashboard === 'function') {
        const team = searchParticipantTeam(q);
        renderPersonalizedTeamDashboard(team ? team.id : q);
      }
    };
    if (btnPartSearch) btnPartSearch.addEventListener('click', doLookup);
    inpPartSearch.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') doLookup();
    });
    inpPartSearch.addEventListener('input', () => {
      const q = inpPartSearch.value.trim();
      if (!q) return;
      if (typeof searchParticipantTeam === 'function' && typeof renderPersonalizedTeamDashboard === 'function') {
        const team = searchParticipantTeam(q);
        if (team) renderPersonalizedTeamDashboard(team.id);
      }
    });
  }

  // Initial View Render
  refreshAllViews();
  handleHashRouting();
});

function switchTab(tabId) {
  const hasParticipantsTab = !!document.getElementById('view-participants');

  // Default targetTab based on page type
  if (hasParticipantsTab && (!tabId || tabId === 'participants')) {
    tabId = 'participants';
  } else if (!tabId) {
    tabId = 'dashboard';
  }

  // Security Guard: Restrict judging tabs to authenticated judges only (participants view is public)
  const isJudgeTab = tabId !== 'participants';
  if (isJudgeTab && typeof isJudgeAuthenticated === 'function' && !isJudgeAuthenticated()) {
    showJudgeAuthModal(tabId);

    document.querySelectorAll('.nav-btn, .dock-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

    if (hasParticipantsTab) {
      document.querySelectorAll(`[data-tab="participants"]`).forEach(b => b.classList.add('active'));
      const pView = document.getElementById(`view-participants`);
      if (pView) pView.classList.add('active');
      if (typeof renderParticipantsView === 'function') renderParticipantsView();
    } else {
      document.querySelectorAll(`[data-tab="dashboard"]`).forEach(b => b.classList.add('active'));
      const dView = document.getElementById(`view-dashboard`);
      if (dView) dView.classList.add('active');
    }
    return;
  }

  document.querySelectorAll('.nav-btn, .dock-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

  const targetId = (!tabId || (tabId === 'participants' && !hasParticipantsTab)) ? 'dashboard' : tabId;
  const btns = document.querySelectorAll(`[data-tab="${targetId}"]`);
  const view = document.getElementById(`view-${targetId}`);

  btns.forEach(btn => {
    btn.classList.add('active');
    try {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } catch (e) {}
  });
  if (view) view.classList.add('active');

  // Update URL hash without scroll jumping
  if (window.location.hash !== `#${targetId}`) {
    history.replaceState(null, null, `#${targetId}`);
  }

  if (targetId === 'attendance') renderAttendanceTable();
  if (targetId === 'botcheck') renderBotCheckView();
  if (targetId === 'judges') renderJudgesTable();
  if (targetId === 'teams') renderTeamsTable();
  if (targetId === 'callorder') renderCallOrderView();
  if (targetId === 'round3') renderBracket();
  if (targetId === 'leaderboard') renderLeaderboards();
  if (targetId === 'participants' && hasParticipantsTab) {
    if (typeof initParticipantsView === 'function') initParticipantsView();
    else if (typeof renderParticipantsView === 'function') renderParticipantsView();
  }
}

function handleHashRouting() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  const hasParticipantsTab = !!document.getElementById('view-participants');

  if (hash && ['dashboard', 'attendance', 'botcheck', 'judges', 'teams', 'callorder', 'round1', 'round2', 'round3', 'leaderboard', 'participants'].includes(hash)) {
    if (hash === 'participants' && !hasParticipantsTab) {
      switchTab('dashboard');
    } else {
      switchTab(hash);
    }
  } else {
    switchTab(hasParticipantsTab ? 'participants' : 'dashboard');
  }
}

window.addEventListener('hashchange', handleHashRouting);

function switchSubTab(subId) {
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));

  const btn = document.querySelector(`.sub-tab-btn[data-sub="${subId}"]`);
  const view = document.getElementById(subId);

  if (btn) btn.classList.add('active');
  if (view) view.classList.add('active');
}

function refreshAllViews() {
  const activeEl = document.activeElement;
  const isEditingAttendance = activeEl && activeEl.closest && activeEl.closest('#att-tbody');
  const activeElId = activeEl ? activeEl.id : null;
  const activeElVal = activeEl ? activeEl.value : null;

  renderDashboardStats();
  if (!isEditingAttendance) {
    renderAttendanceTable();
  }
  renderBotCheckView();
  renderJudgesTable();
  renderTeamsTable();
  renderCallOrderView();
  populateScoringTeamSelects();
  populateJudgeSelectDropdowns();
  renderSubmittedRuns('r1');
  renderSubmittedRuns('r2');
  renderBracket();
  renderLeaderboards();
  renderParticipantsView();

  const activePartTeamId = sessionStorage.getItem('participant_team_id');
  if (activePartTeamId && typeof renderPersonalizedTeamDashboard === 'function') {
    renderPersonalizedTeamDashboard(activePartTeamId);
  }

  if (activeElId) {
    const el = document.getElementById(activeElId);
    if (el) {
      el.focus();
      if (activeElVal !== null && el.value !== activeElVal) {
        el.value = activeElVal;
      }
    }
  }
}

function renderDashboardStats() {
  const total = storeState.teams.length;
  const present = Object.values(storeState.attendance || {}).filter(a => a.status === 'Present' || a.status === 'Late').length;
  const eligible = storeState.teams.filter(t => t.eligibility && t.eligibility.passed).length;
  const judgesCount = (storeState.judges || []).length;

  const totalEl = document.getElementById('dash-total-teams');
  const presentEl = document.getElementById('dash-present-teams');
  const eligibleEl = document.getElementById('dash-eligible-teams');
  const judgesEl = document.getElementById('dash-judges-count');

  if (totalEl) totalEl.textContent = total;
  if (presentEl) presentEl.textContent = `${present} / ${total}`;
  if (eligibleEl) eligibleEl.textContent = `${eligible} / ${total}`;
  if (judgesEl) judgesEl.textContent = judgesCount;
}

/* ==========================================================================
   1. ATTENDANCE PAGE MODULE
   ========================================================================== */

function renderAttendanceTable() {
  const tbody = document.getElementById('att-tbody');
  if (!tbody) return;

  const searchEl = document.getElementById('att-search');
  const filterEl = document.getElementById('att-filter-select');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  const filter = filterEl ? filterEl.value : 'all';

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
    
    let statusBadge = `<span class="badge badge-danger badge-status">ABSENT</span>`;
    if (att.status === 'Present') statusBadge = `<span class="badge badge-success badge-status">PRESENT</span>`;
    if (att.status === 'Late') statusBadge = `<span class="badge badge-warning badge-status">LATE</span>`;

    const timeStr = att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return `
      <tr data-team-id="${t.id}">
        <td><strong>${t.id}</strong></td>
        <td>${t.name}</td>
        <td>${t.institution}</td>
        <td><span class="badge badge-info">Arena ${t.arena || 'A'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:4px;">
            <input type="number" min="0" max="${t.rosterSize || 5}" value="${att.membersPresent !== undefined ? att.membersPresent : (t.rosterSize || 1)}" class="num-input sm" onchange="updateAttendanceMembers('${t.id}', this.value)" style="width:52px;">
            <span class="text-muted" style="font-size:12px;">/ ${t.rosterSize || 1}</span>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td class="checkin-time-cell">${timeStr}</td>
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
  if (storeState.attendance[teamId].status === status) {
    return; // Prevent duplicate triggers and cloud sync feedback loops
  }
  storeState.attendance[teamId].status = status;
  storeState.attendance[teamId].checkInTime = status !== 'Absent' ? (storeState.attendance[teamId].checkInTime || Date.now()) : null;
  saveStore();

  const row = document.querySelector(`#att-tbody tr[data-team-id="${teamId}"]`);
  if (row) {
    const badgeEl = row.querySelector('.badge-status');
    const timeEl = row.querySelector('.checkin-time-cell');
    if (badgeEl) {
      if (status === 'Present') { badgeEl.className = 'badge badge-success badge-status'; badgeEl.textContent = 'PRESENT'; }
      else if (status === 'Late') { badgeEl.className = 'badge badge-warning badge-status'; badgeEl.textContent = 'LATE'; }
      else { badgeEl.className = 'badge badge-danger badge-status'; badgeEl.textContent = 'ABSENT'; }
    }
    if (timeEl) {
      timeEl.textContent = status !== 'Absent' && storeState.attendance[teamId].checkInTime 
        ? new Date(storeState.attendance[teamId].checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '--:--';
    }
  }

  renderDashboardStats();
  renderTeamsTable();
  populateScoringTeamSelects();
  renderParticipantsView();
}

function updateAttendanceMembers(teamId, count) {
  const val = parseInt(count, 10);
  if (!storeState.attendance[teamId]) {
    storeState.attendance[teamId] = { status: 'Present', checkInTime: Date.now(), membersPresent: val, notes: '' };
  } else {
    if (storeState.attendance[teamId].membersPresent === val) return;
    storeState.attendance[teamId].membersPresent = val;
  }
  saveStore();
  renderDashboardStats();
  renderParticipantsView();
}

/* ==========================================================================
   2. BOT CHECK PAGE MODULE
   ========================================================================== */

function renderBotCheckView() {
  const select = document.getElementById('botcheck-team-select');
  const roundSelect = document.getElementById('botcheck-round-select');
  const roundKey = roundSelect ? roundSelect.value : 'r1';

  // Only teams marked Present or Late in attendance check-in can undergo Bot Check
  const presentTeams = storeState.teams.filter(t => {
    const att = storeState.attendance[t.id] || { status: 'Absent' };
    return att.status === 'Present' || att.status === 'Late';
  });

  if (select) {
    const currentVal = select.value;
    if (presentTeams.length === 0) {
      select.innerHTML = `<option value="">-- No Present Teams (Mark Attendance First) --</option>`;
    } else {
      select.innerHTML = `<option value="">-- Select Present Team to Inspect --</option>` +
        presentTeams.map(t => {
          const elig = t[`eligibility_${roundKey}`] || {};
          const passed = elig.passed;
          const statusTxt = passed ? '✅ VERIFIED PASSED' : '⏳ PENDING INSPECTION';
          return `<option value="${t.id}">${t.id} — ${t.name} (${statusTxt})</option>`;
        }).join('');
    }
    if (currentVal && presentTeams.some(t => t.id === currentVal)) {
      select.value = currentVal;
    }
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

  const roundSelect = document.getElementById('botcheck-round-select');
  const roundKey = roundSelect ? roundSelect.value : 'r1';
  const elig = team[`eligibility_${roundKey}`] || {};

  container.innerHTML = `
    <div class="inspector-header mb-3">
      <h4>Inspection Certificate for ${team.id} (${team.name}) - ${roundKey.toUpperCase()}</h4>
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
      <button class="btn btn-primary lg" onclick="openEligibilityModal('${team.id}', '${roundKey}')">
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

  const roundSelect = document.getElementById('botcheck-round-select');
  const roundKey = roundSelect ? roundSelect.value : 'r1';

  tbody.innerHTML = storeState.teams.map(t => {
    const elig = t[`eligibility_${roundKey}`] || {};
    const passed = elig.passed;
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
          <button class="btn btn-outline sm" onclick="openEligibilityModal('${t.id}', '${roundKey}')">Inspect</button>
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

  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
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
  const activeJudgeName = typeof getActiveJudgeName === 'function' ? getActiveJudgeName() : 'Officiating Judge';

  const options = `<option value="">-- Select Officiating Judge --</option>` +
    judges.map(j => {
      const isSel = j.name === activeJudgeName || judges.length === 1;
      return `<option value="${j.name}" ${isSel ? 'selected' : ''}>${j.name} (${j.role} - Arena ${j.assignedArena})</option>`;
    }).join('');

  if (r1Select) {
    r1Select.innerHTML = options;
    if (!r1Select.value && judges.length > 0) r1Select.value = judges[0].name;
  }
  if (r2Select) {
    r2Select.innerHTML = options;
    if (!r2Select.value && judges.length > 0) r2Select.value = judges[0].name;
  }
}

/* ==========================================================================
   ORDER OF CALL & HEAT SCHEDULE RENDERER
   ========================================================================== */

function renderCallOrderView() {
  // Round 1 Call Order Table
  const r1Tbody = document.getElementById('callorder-r1-tbody');
  if (r1Tbody && typeof getRound1CallOrder === 'function') {
    const queue = getRound1CallOrder();
    r1Tbody.innerHTML = queue.map(q => {
      let badgeClass = 'badge-info';
      if (q.status === 'COMPLETED') badgeClass = 'badge-success';
      if (q.status === 'IN ARENA') badgeClass = 'badge-warning';
      if (q.status === 'ON DECK') badgeClass = 'badge-info';
      if (q.status === 'DISQUALIFIED') badgeClass = 'badge-danger';

      return `
        <tr class="${q.status === 'IN ARENA' ? 'highlight-qualified' : ''}">
          <td><strong>${q.slot}</strong></td>
          <td><span class="badge badge-info">Arena ${q.arena}</span></td>
          <td><strong>${q.teamId}</strong></td>
          <td>${q.teamName}</td>
          <td>${q.institution}</td>
          <td><span class="badge ${badgeClass}">${q.status}</span></td>
          <td><strong>${q.resultTime}</strong></td>
        </tr>
      `;
    }).join('');
  }

  // Round 2 Call Order Table (Top 25)
  const r2Tbody = document.getElementById('callorder-r2-tbody');
  if (r2Tbody && typeof getRound2CallOrder === 'function') {
    const queue = getRound2CallOrder();
    if (queue.length === 0) {
      r2Tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">Complete Round 1 to generate Round 2 Heat Call Sheet</td></tr>`;
    } else {
      r2Tbody.innerHTML = queue.map(q => {
        let badgeClass = 'badge-info';
        if (q.status === 'COMPLETED') badgeClass = 'badge-success';
        if (q.status === 'IN ARENA') badgeClass = 'badge-warning';
        if (q.status === 'ON DECK') badgeClass = 'badge-info';
        if (q.status === 'DISQUALIFIED') badgeClass = 'badge-danger';

        return `
          <tr class="${q.status === 'IN ARENA' ? 'highlight-qualified' : ''}">
            <td><strong>Call #${q.callOrder}</strong></td>
            <td><strong>Seed #${q.seed}</strong></td>
            <td><strong>${q.teamId}</strong></td>
            <td>${q.teamName}</td>
            <td>${q.institution}</td>
            <td><span class="badge ${badgeClass}">${q.status}</span></td>
            <td><strong>${q.resultTime}</strong></td>
          </tr>
        `;
      }).join('');
    }
  }

  // Round 3 Heat Schedule Table
  const r3Tbody = document.getElementById('callorder-r3-tbody');
  if (r3Tbody && typeof getRound3MatchSchedule === 'function') {
    const queue = getRound3MatchSchedule();
    r3Tbody.innerHTML = queue.map(q => {
      let badgeClass = 'badge-info';
      if (q.status === 'COMPLETED') badgeClass = 'badge-success';
      if (q.status === 'READY TO CALL') badgeClass = 'badge-warning';

      return `
        <tr>
          <td><strong>Heat ${q.matchId}</strong></td>
          <td>${q.stage}</td>
          <td><strong>${q.teamADisp}</strong></td>
          <td><strong>${q.teamBDisp}</strong></td>
          <td><span class="badge ${badgeClass}">${q.status}</span></td>
          <td class="text-cyan"><strong>${q.winnerDisp}</strong></td>
        </tr>
      `;
    }).join('');
  }
}

/* ==========================================================================
   4. PARTICIPANTS VIEWING PAGE (SPECTATOR LIVE DISPLAY)
   ========================================================================== */

function renderParticipantsView() {
  if (typeof renderTeamRosterGrid === 'function') {
    renderTeamRosterGrid('page-team-roster');
    renderTeamRosterGrid('admin-team-roster');
  }

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

  const standingsTbody = document.getElementById('part-standings-tbody') || document.getElementById('part-leaderboard-body');
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

  const searchEl = document.getElementById('team-search');
  const filterEl = document.getElementById('team-elig-filter');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  const filter = filterEl ? filterEl.value : 'all';

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

  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
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

  // Round 1 Eligible: Attendance Present/Late AND passed Round 1 Bot Inspection
  const r1Eligible = (storeState.teams || []).filter(t => {
    const att = storeState.attendance[t.id] || { status: 'Absent' };
    const isPresent = att.status === 'Present' || att.status === 'Late';
    const passedTech = t.eligibility_r1 && t.eligibility_r1.passed;
    return isPresent && passedTech;
  });

  if (r1Select) {
    const currentVal = r1Select.value;
    if (r1Eligible.length === 0) {
      r1Select.innerHTML = `<option value="">-- No Eligible Teams (Complete Bot Inspection First) --</option>`;
    } else {
      r1Select.innerHTML = `<option value="">-- Select Inspected Team to Score --</option>` +
        r1Eligible.map(t => `<option value="${t.id}">${t.id} — ${t.name} [Arena ${t.arena || 'A'}]</option>`).join('');
    }
    if (currentVal && r1Eligible.some(t => t.id === currentVal)) {
      r1Select.value = currentVal;
    }
  }

  // Round 2 Eligible: Attendance Present/Late AND passed Round 2 Bot Inspection AND in R1 Top 25
  const r1Ranked = typeof getRankedLeaderboard === 'function' ? getRankedLeaderboard('round1') : [];
  const top25 = r1Ranked.filter(r => !r.disqualified).slice(0, 25);
  
  const r2Eligible = top25.filter(r => {
    const t = storeState.teams.find(team => team.id === r.teamId);
    if (!t) return false;
    const att = storeState.attendance[t.id] || { status: 'Absent' };
    const isPresent = att.status === 'Present' || att.status === 'Late';
    const passedTech = t.eligibility_r2 && t.eligibility_r2.passed;
    return isPresent && passedTech;
  });

  if (r2Select) {
    const currentVal = r2Select.value;
    if (r2Eligible.length === 0) {
      r2Select.innerHTML = `<option value="">-- No R2 Inspected & Qualified Teams --</option>`;
    } else {
      r2Select.innerHTML = `<option value="">-- Select R2 Qualified Team (Top 25) --</option>` +
        r2Eligible.map((r, i) => `<option value="${r.teamId}">#${i+1} ${r.teamId} — ${r.teamName}</option>`).join('');
    }
    if (currentVal && r2Eligible.some(r => r.teamId === currentVal)) {
      r2Select.value = currentVal;
    }
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
  renderBracket();
  renderTeamsTable();
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

  const modal = document.getElementById('modal-match-judge');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
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

  if (typeof updateBracketAdvancement === 'function') {
    updateBracketAdvancement();
  }

  saveStore();
  renderBracket();
  renderLeaderboards();
  renderParticipantsView();
  document.getElementById('modal-match-judge').classList.add('hidden');
}
