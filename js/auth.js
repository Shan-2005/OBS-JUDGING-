/* ==========================================================================
   ROBOFEST 2.0 - JUDGE CREDENTIAL AUTH & PARTICIPANT TEAM GATE
   ========================================================================== */

// ─── JUDGE CREDENTIALS ─────────────────────────────────────────────────────
// Add more judge accounts as needed
const JUDGE_ACCOUNTS = [
  { username: "obsrace26", password: "motoroil", name: "Officiating Judge", arena: "All" }
];

// ─── AUTH STATE ─────────────────────────────────────────────────────────────
function isJudgeAuthenticated() {
  return sessionStorage.getItem('judge_authenticated') === 'true';
}
function getActiveJudgeName() {
  return sessionStorage.getItem('active_judge_name') || "Judge";
}
function getActiveJudgeArena() {
  return sessionStorage.getItem('active_judge_arena') || "All";
}

// ─── JUDGE LOGIN MODAL ──────────────────────────────────────────────────────
function showJudgeAuthModal(requestedTab = 'dashboard') {
  const modal = document.getElementById('modal-judge-auth');
  if (!modal) return;
  modal.setAttribute('data-requested-tab', requestedTab);
  document.getElementById('inp-judge-username').value = '';
  document.getElementById('inp-judge-password').value = '';
  document.getElementById('auth-error-msg').textContent = '';
  document.getElementById('auth-error-msg').classList.add('hidden');
  modal.classList.remove('hidden');
  setTimeout(() => document.getElementById('inp-judge-username').focus(), 100);
}

function handleJudgeLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('inp-judge-username').value.trim().toLowerCase();
  const password = document.getElementById('inp-judge-password').value;
  const errorMsg = document.getElementById('auth-error-msg');

  const account = JUDGE_ACCOUNTS.find(
    a => a.username.toLowerCase() === username && a.password === password
  );

  if (!account) {
    errorMsg.textContent = "❌ Invalid username or password. Contact the organiser if locked out.";
    errorMsg.classList.remove('hidden');
    document.getElementById('inp-judge-password').value = '';
    return;
  }

  // Store session
  sessionStorage.setItem('judge_authenticated', 'true');
  sessionStorage.setItem('active_judge_name', account.name);
  sessionStorage.setItem('active_judge_arena', account.arena);

  document.getElementById('modal-judge-auth').classList.add('hidden');
  updateJudgeHeaderBadge();
  enforceJudgeNavVisibility();

  const reqTab = document.getElementById('modal-judge-auth').getAttribute('data-requested-tab') || 'dashboard';
  if (typeof switchTab === 'function') switchTab(reqTab);
}

function logoutJudge() {
  if (confirm(`Log out ${getActiveJudgeName()} and return to Participant View?`)) {
    sessionStorage.removeItem('judge_authenticated');
    sessionStorage.removeItem('active_judge_name');
    sessionStorage.removeItem('active_judge_arena');
    updateJudgeHeaderBadge();
    enforceJudgeNavVisibility();
    if (typeof switchTab === 'function') switchTab('participants');
  }
}

// ─── NAV GUARD ──────────────────────────────────────────────────────────────
function enforceJudgeNavVisibility() {
  const isAuth = isJudgeAuthenticated();
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === 'participants') return; // Always visible
    if (isAuth) {
      btn.classList.remove('judge-locked-btn');
      btn.title = '';
    } else {
      btn.classList.add('judge-locked-btn');
      btn.title = '🔒 Judge Login Required';
    }
  });
}

// ─── HEADER BADGE ───────────────────────────────────────────────────────────
function updateJudgeHeaderBadge() {
  const badge = document.getElementById('judge-session-badge');
  if (!badge) return;
  if (isJudgeAuthenticated()) {
    const arena = getActiveJudgeArena();
    badge.innerHTML = `
      <span class="badge badge-success">👨‍⚖️ ${getActiveJudgeName()}${arena !== 'All' ? ` · Arena ${arena}` : ''}</span>
      <button onclick="logoutJudge()" class="btn btn-danger-ghost sm ml-2">🔒 Logout</button>
    `;
  } else {
    badge.innerHTML = `
      <span class="badge badge-secondary mr-2">👁️ Participant View</span>
      <button onclick="showJudgeAuthModal('dashboard')" class="btn btn-warning sm">🔑 Judge Login</button>
    `;
  }
}

// ─── PARTICIPANT TEAM GATE ───────────────────────────────────────────────────
function getParticipantTeamName() {
  return sessionStorage.getItem('participant_team_name') || null;
}

function showParticipantTeamGate() {
  const modal = document.getElementById('modal-participant-gate');
  if (modal) {
    document.getElementById('inp-participant-team-name').value = '';
    document.getElementById('participant-gate-error').classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('inp-participant-team-name').focus(), 100);
  }
}

function handleParticipantGateSubmit(e) {
  e.preventDefault();
  const teamName = document.getElementById('inp-participant-team-name').value.trim();
  const errorEl = document.getElementById('participant-gate-error');

  if (!teamName) {
    errorEl.textContent = "Please enter your Team Name or Bot ID.";
    errorEl.classList.remove('hidden');
    return;
  }

  // Search for matching team
  const team = typeof searchParticipantTeam === 'function' ? searchParticipantTeam(teamName) : null;

  if (!team) {
    errorEl.textContent = `⚠️ No team found for "${teamName}". Check your Bot ID or Team Name with the organiser desk.`;
    errorEl.classList.remove('hidden');
    return;
  }

  // Save to session
  sessionStorage.setItem('participant_team_name', team.name);
  sessionStorage.setItem('participant_team_id', team.id);

  document.getElementById('modal-participant-gate').classList.add('hidden');

  // Show personalized dashboard
  if (typeof renderPersonalizedTeamDashboard === 'function') {
    renderPersonalizedTeamDashboard(team.id);
  }
}

function changeParticipantTeam() {
  sessionStorage.removeItem('participant_team_name');
  sessionStorage.removeItem('participant_team_id');
  showParticipantTeamGate();
}

// Called when Participants tab is activated
function initParticipantsView() {
  // Always populate both rosters first
  if (typeof renderTeamRosterGrid === 'function') {
    renderTeamRosterGrid('page-team-roster');
    renderTeamRosterGrid('gate-team-roster');
  }

  const savedId = sessionStorage.getItem('participant_team_id');
  if (savedId) {
    if (typeof renderPersonalizedTeamDashboard === 'function') {
      renderPersonalizedTeamDashboard(savedId);
    }
  } else {
    showParticipantTeamGate();
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const judgeForm = document.getElementById('form-judge-auth');
  if (judgeForm) judgeForm.addEventListener('submit', handleJudgeLoginSubmit);

  const partForm = document.getElementById('form-participant-gate');
  if (partForm) partForm.addEventListener('submit', handleParticipantGateSubmit);

  updateJudgeHeaderBadge();
  enforceJudgeNavVisibility();
});
