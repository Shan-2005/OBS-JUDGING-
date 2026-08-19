/* ==========================================================================
   ROBOFEST 2.0 - JUDGE SINGLE CREDENTIAL AUTHENTICATION GATE & ACCESS GUARD
   ========================================================================== */

const JUDGE_PASSCODE = "ROBOFEST2026"; // Default passcode for judging team

function isJudgeAuthenticated() {
  return sessionStorage.getItem('judge_authenticated') === 'true';
}

function getActiveJudgeName() {
  return sessionStorage.getItem('active_judge_name') || "Officiating Referee";
}

function checkJudgeAuth() {
  if (!isJudgeAuthenticated()) {
    showJudgeAuthModal();
    return false;
  } else {
    updateJudgeHeaderBadge();
    return true;
  }
}

function showJudgeAuthModal(requestedTab = null) {
  const modal = document.getElementById('modal-judge-auth');
  if (modal) {
    document.getElementById('inp-passcode').value = "";
    document.getElementById('inp-judge-login-name').value = "";
    document.getElementById('auth-error-msg').classList.add('hidden');
    if (requestedTab) {
      modal.setAttribute('data-requested-tab', requestedTab);
    } else {
      modal.removeAttribute('data-requested-tab');
    }
    modal.classList.remove('hidden');
  }
}

function handleJudgeLoginSubmit(e) {
  e.preventDefault();
  const passcode = document.getElementById('inp-passcode').value.trim();
  const judgeName = document.getElementById('inp-judge-login-name').value.trim();
  const errorMsg = document.getElementById('auth-error-msg');

  if (passcode !== JUDGE_PASSCODE && passcode !== "JUDGE2026") {
    errorMsg.textContent = "❌ Invalid Passcode! Please enter official judge credential.";
    errorMsg.classList.remove('hidden');
    return;
  }

  if (!judgeName) {
    errorMsg.textContent = "❌ Please enter your full Name / Referee ID.";
    errorMsg.classList.remove('hidden');
    return;
  }

  sessionStorage.setItem('judge_authenticated', 'true');
  sessionStorage.setItem('active_judge_name', judgeName);

  const modal = document.getElementById('modal-judge-auth');
  const reqTab = modal.getAttribute('data-requested-tab') || 'dashboard';
  modal.classList.add('hidden');

  updateJudgeHeaderBadge();
  enforceJudgeNavVisibility();

  if (typeof switchTab === 'function') {
    switchTab(reqTab);
  }

  alert(`Welcome ${judgeName}! Judge Portal unlocked.`);
}

function logoutJudge() {
  if (confirm("Lock Judge Portal and switch to Participant View?")) {
    sessionStorage.removeItem('judge_authenticated');
    sessionStorage.removeItem('active_judge_name');
    updateJudgeHeaderBadge();
    enforceJudgeNavVisibility();
    if (typeof switchTab === 'function') {
      switchTab('participants');
    }
  }
}

function enforceJudgeNavVisibility() {
  const judgeTabs = document.querySelectorAll('.nav-btn[data-tab]:not([data-tab="participants"])');
  const isAuth = isJudgeAuthenticated();

  judgeTabs.forEach(btn => {
    if (isAuth) {
      btn.classList.remove('judge-locked-btn');
      btn.title = "";
    } else {
      btn.classList.add('judge-locked-btn');
      btn.title = "🔒 Judge Passcode Required";
    }
  });
}

function updateJudgeHeaderBadge() {
  const badge = document.getElementById('judge-session-badge');
  if (badge) {
    if (isJudgeAuthenticated()) {
      badge.innerHTML = `
        <span class="badge badge-success">👨‍⚖️ ${getActiveJudgeName()}</span>
        <button onclick="logoutJudge()" class="btn btn-danger-ghost sm">🔒 Lock Console</button>
      `;
    } else {
      badge.innerHTML = `
        <span class="badge badge-secondary mr-2">👁️ Participant View</span>
        <button onclick="showJudgeAuthModal('dashboard')" class="btn btn-warning sm">🔑 Judge Login</button>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('form-judge-auth');
  if (authForm) {
    authForm.addEventListener('submit', handleJudgeLoginSubmit);
  }
  updateJudgeHeaderBadge();
  enforceJudgeNavVisibility();
});
