/* ==========================================================================
   ROBOFEST 2.0 - PRE-MATCH ELIGIBILITY CHECKLIST MODULE
   ========================================================================== */

const CHECKLIST_KEYS = [
  'dimensions', 'weight', 'voltage', 'driveType', 'bodyOrigin',
  'wiredControl', 'wirelessControl', 'bannedParts', 'teamMembers', 'dedicatedTxRx'
];

function openEligibilityModal(teamId, roundKey) {
  const team = storeState.teams.find(t => t.id === teamId);
  if (!team) return;

  if (!roundKey) {
    const roundSelect = document.getElementById('botcheck-round-select');
    roundKey = roundSelect ? roundSelect.value : 'r1';
  }

  document.getElementById('elig-modal-team-name').textContent = `${team.name} (${roundKey.toUpperCase()} Tech Inspection)`;
  document.getElementById('elig-modal-bot-id').textContent = team.id;
  
  const form = document.getElementById('form-eligibility');
  form.dataset.teamId = team.id;
  form.dataset.roundKey = roundKey;

  const eligKey = `eligibility_${roundKey}`;
  const elig = team[eligKey] || {};
  
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

  const modal = document.getElementById('modal-eligibility');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
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
  const form = document.getElementById('form-eligibility');
  const teamId = form.dataset.teamId;
  const roundKey = form.dataset.roundKey || 'r1';
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

  // Save to round-specific key and legacy compatibility key
  team[`eligibility_${roundKey}`] = elig;
  if (roundKey === 'r1') {
    team.eligibility = elig;
  }
  
  saveStore();
  
  document.getElementById('modal-eligibility').classList.add('hidden');
  if (typeof renderBotCheckView === 'function') renderBotCheckView();
  if (typeof renderBotCheckInspectorCard === 'function') renderBotCheckInspectorCard(teamId);
  if (typeof renderTeamsTable === 'function') renderTeamsTable();
  if (typeof renderDashboardStats === 'function') renderDashboardStats();
  if (typeof populateScoringTeamSelects === 'function') populateScoringTeamSelects();
  if (typeof renderParticipantsView === 'function') renderParticipantsView();
}

function passAllEligibilityChecklist() {
  CHECKLIST_KEYS.forEach(key => {
    const chk = document.getElementById(`chk-${key}`);
    if (chk) chk.checked = true;
  });
  updateEligibilityModalBanner();
}

function resetEligibilityChecklist() {
  CHECKLIST_KEYS.forEach(key => {
    const chk = document.getElementById(`chk-${key}`);
    if (chk) chk.checked = false;
  });
  updateEligibilityModalBanner();
}
