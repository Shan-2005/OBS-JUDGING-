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

function preparePrintSheets() {
  const r1List = getRankedLeaderboard('round1');
  const printTbody = document.getElementById('print-r1-r2-tbody');
  
  if (printTbody) {
    printTbody.innerHTML = r1List.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.teamId}</td>
        <td>${r.teamName}</td>
        <td>${r.arena}</td>
        <td>${(r.rawTimeMs/1000).toFixed(3)}</td>
        <td>${r.penaltySeconds.toFixed(2)}</td>
        <td>${(r.finalTimeMs/1000).toFixed(3)}</td>
      </tr>
    `).join('');
  }

  const printR3Tbody = document.getElementById('print-r3-tbody');
  if (printR3Tbody) {
    const matches = storeState.round3.matches;
    printR3Tbody.innerHTML = Object.values(matches).map(match => `
      <tr>
        <td>${match.id}</td>
        <td>${match.stage}</td>
        <td>${match.teamA || 'TBD'}</td>
        <td>${match.teamB || 'TBD'}</td>
        <td>${match.winner || 'TBD'}</td>
        <td>${match.reason || ''}</td>
      </tr>
    `).join('');
  }

  window.print();
}
