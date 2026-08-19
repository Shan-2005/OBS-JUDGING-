/* ==========================================================================
   ROBOFEST 2.0 - EXPORT & PRINT FORMATTER ENGINE
   ========================================================================== */

function exportScoresCSV() {
  const r1List = getRankedLeaderboard('round1');
  const r2List = getRankedLeaderboard('round2');
  const m = storeState.round3.matches;

  let csv = "ROBOFEST 2.0 - OBSTACLE RACE OFFICIAL SCORES\n\n";

  csv += "ROUND 1 RESULTS (58 -> 25)\n";
  csv += "Rank,Bot ID,Team Name,Institution,Arena,Raw Time (s),Penalties (s),Final Time (s),Status\n";
  r1List.forEach((r, idx) => {
    csv += `${idx + 1},"${r.teamId}","${r.teamName}","${r.institution}",${r.arena},${(r.rawTimeMs/1000).toFixed(3)},${r.penaltySeconds.toFixed(2)},${(r.finalTimeMs/1000).toFixed(3)},"${r.disqualified ? 'DQ: '+r.dqReason : 'VALID'}"\n`;
  });

  csv += "\nROUND 2 RESULTS (25 -> 9)\n";
  csv += "Seed/Rank,Bot ID,Team Name,Institution,Raw Time (s),Penalties (s),Final Time (s),Status\n";
  r2List.forEach((r, idx) => {
    csv += `${idx + 1},"${r.teamId}","${r.teamName}","${r.institution}",${(r.rawTimeMs/1000).toFixed(3)},${r.penaltySeconds.toFixed(2)},${(r.finalTimeMs/1000).toFixed(3)},"${r.disqualified ? 'DQ: '+r.dqReason : 'VALID'}"\n`;
  });

  csv += "\nROUND 3 KNOCKOUT BRACKET MATCHES\n";
  csv += "Match #,Stage,Matchup,Team A,Team B,Winner,Reason\n";
  Object.values(m).forEach(match => {
    csv += `"${match.id}","${match.stage}","${match.matchUp}","${match.teamA || ''}","${match.teamB || ''}","${match.winner || ''}","${match.reason || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `RoboFest_2.0_Obstacle_Race_Scores_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function preparePrintSheets(targetRound = 'all') {
  const r1List = getRankedLeaderboard('round1');
  const r2List = getRankedLeaderboard('round2');
  const m = storeState.round3 ? storeState.round3.matches : {};

  // 1. Populate Round 1 Table
  const printR1Tbody = document.getElementById('print-r1-tbody');
  if (printR1Tbody) {
    printR1Tbody.innerHTML = r1List.map((r, idx) => {
      const rawStr = r.hasRun ? `${(r.rawTimeMs / 1000).toFixed(3)}s` : '--';
      const penStr = r.hasRun ? `+${r.penaltySeconds.toFixed(2)}s` : '--';
      const finalStr = r.hasRun ? `${(r.finalTimeMs / 1000).toFixed(3)}s` : '--';
      let statusStr = 'PENDING RUN';
      if (r.hasRun) {
        statusStr = r.disqualified ? `DISQUALIFIED (${r.dqReason || ''})` : (idx < 25 ? 'TOP 25 QUALIFIED' : 'COMPLETED');
      }
      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${r.teamId}</strong></td>
          <td>${r.teamName}</td>
          <td>${r.institution || '--'}</td>
          <td>Arena ${r.arena}</td>
          <td>${rawStr}</td>
          <td>${penStr}</td>
          <td><strong>${finalStr}</strong></td>
          <td>${statusStr}</td>
        </tr>
      `;
    }).join('');
  }

  // 2. Populate Round 2 Table
  const printR2Tbody = document.getElementById('print-r2-tbody');
  if (printR2Tbody) {
    printR2Tbody.innerHTML = r2List.map((r, idx) => {
      const rawStr = r.hasRun ? `${(r.rawTimeMs / 1000).toFixed(3)}s` : '--';
      const penStr = r.hasRun ? `+${r.penaltySeconds.toFixed(2)}s` : '--';
      const finalStr = r.hasRun ? `${(r.finalTimeMs / 1000).toFixed(3)}s` : '--';
      let statusStr = 'PENDING R2 RUN';
      if (r.hasRun) {
        statusStr = r.disqualified ? `DISQUALIFIED (${r.dqReason || ''})` : (idx < 9 ? 'TOP 9 ADVANCED' : 'COMPLETED');
      }
      return `
        <tr>
          <td><strong>Seed #${idx + 1}</strong></td>
          <td><strong>${r.teamId}</strong></td>
          <td>${r.teamName}</td>
          <td>${r.institution || '--'}</td>
          <td>${rawStr}</td>
          <td>${penStr}</td>
          <td><strong>${finalStr}</strong></td>
          <td>${statusStr}</td>
        </tr>
      `;
    }).join('');
  }

  // 3. Populate Round 3 Podium Table
  const printPodiumTbody = document.getElementById('print-podium-tbody');
  if (printPodiumTbody) {
    const finalWinner = m.M9 ? m.M9.winner : null;
    const finalRunnerUp = m.M9 && m.M9.winner ? (m.M9.winner === m.M9.teamA ? m.M9.teamB : m.M9.teamA) : null;
    const thirdPlace = m.M8 ? m.M8.winner : null;

    printPodiumTbody.innerHTML = `
      <tr>
        <td>🏆 <strong>1ST PLACE (CHAMPION)</strong></td>
        <td><strong>${finalWinner ? finalWinner : 'TBD'}</strong></td>
        <td>${finalWinner ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(finalWinner) : finalWinner) : 'TBD'}</td>
      </tr>
      <tr>
        <td>🥈 <strong>2ND PLACE (RUNNER UP)</strong></td>
        <td><strong>${finalRunnerUp ? finalRunnerUp : 'TBD'}</strong></td>
        <td>${finalRunnerUp ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(finalRunnerUp) : finalRunnerUp) : 'TBD'}</td>
      </tr>
      <tr>
        <td>🥉 <strong>3RD PLACE (2ND RUNNER UP)</strong></td>
        <td><strong>${thirdPlace ? thirdPlace : 'TBD'}</strong></td>
        <td>${thirdPlace ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(thirdPlace) : thirdPlace) : 'TBD'}</td>
      </tr>
    `;
  }

  // 4. Populate Round 3 Knockout Matches Table
  const printR3Tbody = document.getElementById('print-r3-tbody');
  if (printR3Tbody) {
    printR3Tbody.innerHTML = Object.values(m).map(match => `
      <tr>
        <td><strong>${match.id}</strong></td>
        <td>${match.stage}</td>
        <td>${match.teamA ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(match.teamA) : match.teamA) : 'TBD'}</td>
        <td>${match.teamB ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(match.teamB) : match.teamB) : 'TBD'}</td>
        <td><strong>${match.winner ? (typeof getTeamDisplayName === 'function' ? getTeamDisplayName(match.winner) : match.winner) : 'PENDING'}</strong></td>
        <td>${match.reason || '--'}</td>
      </tr>
    `).join('');
  }

  // 5. Populate Officiating Judges Sign-Off Table
  const printJudgesTbody = document.getElementById('print-judges-tbody');
  if (printJudgesTbody) {
    const judges = storeState.judges || [];
    printJudgesTbody.innerHTML = judges.map(j => `
      <tr>
        <td><strong>${j.name}</strong> (${j.id})</td>
        <td>${j.role}</td>
        <td>Arena ${j.assignedArena}</td>
        <td style="height:36px;"></td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  // Toggle Visibility based on targetRound parameter
  const secR1 = document.getElementById('print-sec-r1');
  const secR2 = document.getElementById('print-sec-r2');
  const secR3 = document.getElementById('print-sec-r3');

  if (secR1) secR1.style.display = (targetRound === 'all' || targetRound === 'r1') ? 'block' : 'none';
  if (secR2) secR2.style.display = (targetRound === 'all' || targetRound === 'r2') ? 'block' : 'none';
  if (secR3) secR3.style.display = (targetRound === 'all' || targetRound === 'r3') ? 'block' : 'none';

  window.print();
}
