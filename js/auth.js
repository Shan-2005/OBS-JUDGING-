/* ==========================================================================
   ROBOFEST 2.0 - JUDGE CREDENTIAL AUTH & ACCESS GUARD
   ========================================================================== */

const JUDGE_ACCOUNTS = [
  { username: "obsrace26", password: "motoroil", name: "Officiating Judge", arena: "All" }
];

function isJudgeAuthenticated() {
  return sessionStorage.getItem('judge_authenticated') === 'true';
}
function getActiveJudgeName() {
  return sessionStorage.getItem('active_judge_name') || "Judge";
}
function getActiveJudgeArena() {
  return sessionStorage.getItem('active_judge_arena') || "All";
}

function checkJudgeAuth() {
  const header = document.querySelector('.app-header');
  const main = document.querySelector('.app-main');
  const modal = document.getElementById('modal-judge-auth');

  if (!modal) return true;

  if (!isJudgeAuthenticated()) {
    if (header) header.style.display = 'none';
    if (main) main.style.display = 'none';
    showJudgeAuthModal();
    return false;
  } else {
    if (header) header.style.display = 'flex';
    if (main) main.style.display = 'block';
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    updateJudgeHeaderBadge();
    return true;
  }
}

function showJudgeAuthModal(requestedTab = 'dashboard') {
  const modal = document.getElementById('modal-judge-auth');
  if (!modal) return;
  modal.setAttribute('data-requested-tab', requestedTab);
  const uInp = document.getElementById('inp-judge-username');
  const pInp = document.getElementById('inp-judge-password');
  const errorMsg = document.getElementById('auth-error-msg');
  if (uInp) uInp.value = '';
  if (pInp) pInp.value = '';
  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    errorMsg.style.display = 'none';
  }
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  setTimeout(() => {
    if (uInp) uInp.focus();
  }, 100);
}

function handleJudgeLoginSubmit(e) {
  if (e) e.preventDefault();
  const usernameEl = document.getElementById('inp-judge-username');
  const passwordEl = document.getElementById('inp-judge-password');
  const errorMsg = document.getElementById('auth-error-msg');

  if (!usernameEl || !passwordEl) return;

  const username = usernameEl.value.trim().toLowerCase();
  const password = passwordEl.value;

  const account = JUDGE_ACCOUNTS.find(
    a => a.username.toLowerCase() === username && a.password === password
  );

  if (!account) {
    if (errorMsg) {
      errorMsg.textContent = "❌ Invalid username or password. Please re-enter.";
      errorMsg.classList.remove('hidden');
      errorMsg.style.display = 'block';
    }
    passwordEl.value = '';
    return;
  }

  // Store session
  sessionStorage.setItem('judge_authenticated', 'true');
  sessionStorage.setItem('active_judge_name', account.name);
  sessionStorage.setItem('active_judge_arena', account.arena);

  const modal = document.getElementById('modal-judge-auth');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }

  // Reveal interface
  const header = document.querySelector('.app-header');
  const main = document.querySelector('.app-main');
  if (header) header.style.display = 'flex';
  if (main) main.style.display = 'block';

  updateJudgeHeaderBadge();
  enforceJudgeNavVisibility();

  let reqTab = (modal && modal.getAttribute('data-requested-tab')) || 'dashboard';
  if (reqTab === 'participants') reqTab = 'dashboard';
  if (typeof switchTab === 'function') switchTab(reqTab);
}

function logoutJudge() {
  if (confirm(`Log out ${getActiveJudgeName()}?`)) {
    sessionStorage.removeItem('judge_authenticated');
    sessionStorage.removeItem('active_judge_name');
    sessionStorage.removeItem('active_judge_arena');
    location.reload();
  }
}

function enforceJudgeNavVisibility() {
  const isAuth = isJudgeAuthenticated();
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === 'participants') return;
    if (isAuth) {
      btn.classList.remove('judge-locked-btn');
      btn.title = '';
    } else {
      btn.classList.add('judge-locked-btn');
      btn.title = 'Judge Login Required';
    }
  });
}

function updateJudgeHeaderBadge() {
  const badge = document.getElementById('judge-session-badge');
  if (!badge) return;
  if (isJudgeAuthenticated()) {
    const arena = getActiveJudgeArena();
    badge.innerHTML = `
      <span class="badge badge-success"><i class="fa-solid fa-user-shield"></i> ${getActiveJudgeName()}${arena !== 'All' ? ` · Arena ${arena}` : ''}</span>
      <button onclick="logoutJudge()" class="btn btn-danger-ghost sm ml-2"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
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

  const team = typeof searchParticipantTeam === 'function' ? searchParticipantTeam(teamName) : null;

  if (!team) {
    errorEl.textContent = `⚠️ No team found for "${teamName}". Check your Bot ID or Team Name from the list below.`;
    errorEl.classList.remove('hidden');
    return;
  }

  sessionStorage.setItem('participant_team_name', team.name);
  sessionStorage.setItem('participant_team_id', team.id);

  document.getElementById('modal-participant-gate').classList.add('hidden');

  if (typeof renderPersonalizedTeamDashboard === 'function') {
    renderPersonalizedTeamDashboard(team.id);
  }
}

function changeParticipantTeam() {
  sessionStorage.removeItem('participant_team_name');
  sessionStorage.removeItem('participant_team_id');
  showParticipantTeamGate();
}

function initParticipantsView() {
  if (typeof renderTeamRosterGrid === 'function') {
    renderTeamRosterGrid('page-team-roster');
    renderTeamRosterGrid('admin-team-roster');
    renderTeamRosterGrid('gate-team-roster');
  }

  const savedId = sessionStorage.getItem('participant_team_id');
  const initialTeamId = savedId || (storeState.teams && storeState.teams[0] ? storeState.teams[0].id : 'BOT-001');

  if (typeof renderPersonalizedTeamDashboard === 'function') {
    renderPersonalizedTeamDashboard(initialTeamId);
  }

  if (!savedId && typeof showParticipantTeamGate === 'function') {
    showParticipantTeamGate();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const judgeForm = document.getElementById('form-judge-auth');
  if (judgeForm) judgeForm.addEventListener('submit', handleJudgeLoginSubmit);

  const partForm = document.getElementById('form-participant-gate');
  if (partForm) partForm.addEventListener('submit', handleParticipantGateSubmit);

  checkJudgeAuth();
});
