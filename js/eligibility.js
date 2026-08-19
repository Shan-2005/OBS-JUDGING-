/* ==========================================================================
   ROBOFEST 2.0 - PRE-MATCH ELIGIBILITY CHECKLIST MODULE
   ========================================================================== */

const CHECKLIST_KEYS = [
  'dimensions', 'weight', 'voltage', 'driveType', 'bodyOrigin',
  'wiredControl', 'wirelessControl', 'bannedParts', 'teamMembers', 'dedicatedTxRx'
];

function openEligibilityModal(teamId) {
  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) return;

  document.getElementById('elig-modal-team-name').textContent = team.name;
  document.getElementById('elig-modal-bot-id').textContent = team.id;
  document.getElementById('form-eligibility').dataset.teamId = team.id;

  const elig = team.eligibility || {};
  CHECKLIST_KEYS.forEach(key => {
    const chk = document.getElementById(`chk-${key}`);
    if (chk) chk.checked = !!elig[key];
  });

  const notesInp = document.getElementById('chk-notes');
  if (notesInp) notesInp.value = elig.notes || '';

  updateEligibilityModalBanner();
  
  // Attach real-time toggle listener
  CHECKLIST_KEYS.forEach(key => {
    const chk = document.getElementById(`chk-${key}`);
    if (chk) chk.onchange = updateEligibilityModalBanner;
  });

  document.getElementById('modal-eligibility').classList.remove('hidden');
}

function updateEligibilityModalBanner() {
  const banner = document.getElementById('elig-status-banner');
  if (!banner) return;

  const allPassed = CHECKLIST_KEYS.every(key => {
    const chk = document.getElementById(`chk-${key}`);
    return chk && chk.checked;
  });

  if (allPassed) {
    banner.textContent = "STATUS: VERIFIED PASSED — PERMITTED TO COMPETE";
    banner.className = "eligibility-status-banner badge-success";
  } else {
    banner.textContent = "STATUS: FAILED / NOT PERMITTED TO COMPETE (1+ NO)";
    banner.className = "eligibility-status-banner badge-danger";
  }
}

function saveEligibilityForm(e) {
  e.preventDefault();
  const teamId = document.getElementById('form-eligibility').dataset.teamId;
  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) return;

  const elig = {};
  let passedCount = 0;

  CHECKLIST_KEYS.forEach(key => {
    const chk = document.getElementById(`chk-${key}`);
    const isChecked = chk ? chk.checked : false;
    elig[key] = isChecked;
    if (isChecked) passedCount++;
  });

  elig.passed = passedCount === CHECKLIST_KEYS.length;
  elig.notes = document.getElementById('chk-notes').value || '';

  team.eligibility = elig;
  saveStore();
  
  document.getElementById('modal-eligibility').classList.add('hidden');
  renderTeamsTable();
  renderDashboardStats();
  populateScoringTeamSelects();
}
