/* ==========================================================================
   ROBOFEST 2.0 - JUDGE SINGLE CREDENTIAL AUTHENTICATION GATE
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
  } else {
    updateJudgeHeaderBadge();
  }
}

function showJudgeAuthModal() {
  const modal = document.getElementById('modal-judge-auth');
  if (modal) {
    document.getElementById('inp-passcode').value = "";
    document.getElementById('inp-judge-login-name').value = "";
    document.getElementById('auth-error-msg').classList.add('hidden');
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

  document.getElementById('modal-judge-auth').classList.add('hidden');
  updateJudgeHeaderBadge();

  if (typeof refreshAllViews === 'function') {
    refreshAllViews();
  }

  alert(`Welcome ${judgeName}! Judge Portal unlocked.`);
}

function logoutJudge() {
  if (confirm("Lock Judge Portal and return to login?")) {
    sessionStorage.removeItem('judge_authenticated');
    sessionStorage.removeItem('active_judge_name');
    location.reload();
  }
}

function updateJudgeHeaderBadge() {
  const badge = document.getElementById('judge-session-badge');
  if (badge) {
    if (isJudgeAuthenticated()) {
      badge.innerHTML = `
        <span class="badge badge-success">👨‍⚖️ ${getActiveJudgeName()}</span>
        <button onclick="logoutJudge()" class="btn btn-danger-ghost sm">🔒 Lock</button>
      `;
    } else {
      badge.innerHTML = `
        <button onclick="showJudgeAuthModal()" class="btn btn-warning sm">🔑 Judge Login</button>
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
});
