/* ==========================================================================
   ROBOFEST 2.0 - ORDER OF CALL & HEAT SCHEDULE GENERATOR MODULE
   ========================================================================== */

function getRound1CallOrder() {
  const teams = storeState.teams || [];
  const arenaA = teams.filter(t => t.arena === 'A');
  const arenaB = teams.filter(t => t.arena === 'B');

  const queue = [];
  const maxLen = Math.max(arenaA.length, arenaB.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < arenaA.length) {
      const t = arenaA[i];
      const run = storeState.round1[t.id];
      queue.push({
        slot: `A-${i+1}`,
        arena: 'A',
        teamId: t.id,
        teamName: t.name,
        institution: t.institution,
        status: run ? (run.disqualified ? 'DISQUALIFIED' : 'COMPLETED') : (i === 0 ? 'IN ARENA' : (i === 1 ? 'ON DECK' : 'QUEUED')),
        resultTime: run ? formatMsToDisplay(run.finalTimeMs) : '--'
      });
    }

    if (i < arenaB.length) {
      const t = arenaB[i];
      const run = storeState.round1[t.id];
      queue.push({
        slot: `B-${i+1}`,
        arena: 'B',
        teamId: t.id,
        teamName: t.name,
        institution: t.institution,
        status: run ? (run.disqualified ? 'DISQUALIFIED' : 'COMPLETED') : (i === 0 ? 'IN ARENA' : (i === 1 ? 'ON DECK' : 'QUEUED')),
        resultTime: run ? formatMsToDisplay(run.finalTimeMs) : '--'
      });
    }
  }

  return queue;
}

function getRound2CallOrder() {
  const r1Ranked = getRankedLeaderboard('round1');
  const top25 = r1Ranked.filter(r => !r.disqualified).slice(0, 25);

  return top25.map((r, idx) => {
    const run = storeState.round2[r.teamId];
    let status = 'QUEUED';
    if (run) {
      status = run.disqualified ? 'DISQUALIFIED' : 'COMPLETED';
    } else {
      const completedR2Count = Object.keys(storeState.round2 || {}).length;
      if (idx === completedR2Count) status = 'IN ARENA';
      else if (idx === completedR2Count + 1) status = 'ON DECK';
    }

    return {
      callOrder: idx + 1,
      seed: idx + 1,
      teamId: r.teamId,
      teamName: r.teamName,
      institution: r.institution,
      status: status,
      resultTime: run ? formatMsToDisplay(run.finalTimeMs) : '--'
    };
  });
}

function getRound3MatchSchedule() {
  const m = storeState.round3.matches;
  const matches = [
    { matchId: 'M1', stage: 'Play-in Match', teamA: m.M1.teamA, teamB: m.M1.teamB, winner: m.M1.winner },
    { matchId: 'M2', stage: 'Quarterfinal 1 (QF1)', teamA: m.M2.teamA, teamB: m.M2.teamB, winner: m.M2.winner },
    { matchId: 'M3', stage: 'Quarterfinal 2 (QF2)', teamA: m.M3.teamA, teamB: m.M3.teamB, winner: m.M3.winner },
    { matchId: 'M4', stage: 'Quarterfinal 3 (QF3)', teamA: m.M4.teamA, teamB: m.M4.teamB, winner: m.M4.winner },
    { matchId: 'M5', stage: 'Quarterfinal 4 (QF4)', teamA: m.M5.teamA, teamB: m.M5.teamB, winner: m.M5.winner },
    { matchId: 'M6', stage: 'Semifinal 1 (SF1)', teamA: m.M6.teamA, teamB: m.M6.teamB, winner: m.M6.winner },
    { matchId: 'M7', stage: 'Semifinal 2 (SF2)', teamA: m.M7.teamA, teamB: m.M7.teamB, winner: m.M7.winner },
    { matchId: 'M8', stage: '3rd Place Match', teamA: m.M8.teamA, teamB: m.M8.teamB, winner: m.M8.winner },
    { matchId: 'M9', stage: 'Grand Final', teamA: m.M9.teamA, teamB: m.M9.teamB, winner: m.M9.winner }
  ];

  return matches.map((item, idx) => {
    let status = 'UPCOMING';
    if (item.winner) {
      status = 'COMPLETED';
    } else if (item.teamA && item.teamB) {
      const prevDone = idx === 0 || matches[idx-1].winner;
      status = prevDone ? 'READY TO CALL' : 'WAITING SEEDS';
    }

    return {
      callOrder: idx + 1,
      ...item,
      teamADisp: getTeamDisplayName(item.teamA),
      teamBDisp: getTeamDisplayName(item.teamB),
      winnerDisp: item.winner ? getTeamDisplayName(item.winner) : '--',
      status: status
    };
  });
}
