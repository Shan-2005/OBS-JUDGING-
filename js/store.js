/* ==========================================================================
   ROBOFEST 2.0 - DATA STORE & STORAGE ENGINE (ENHANCED)
   ========================================================================== */

const STORAGE_KEY = 'robofest_obs_judging_v2';

const defaultState = {
  teams: [],
  judges: [
    { id: "J-001", name: "Dr. A. Sharma", role: "Head Referee", assignedArena: "A", phone: "+91 9876543210" },
    { id: "J-002", name: "Prof. K. Ramesh", role: "Arena B Judge", assignedArena: "B", phone: "+91 9876543211" },
    { id: "J-003", name: "Er. M. Vikram", role: "Tech Inspector", assignedArena: "All", phone: "+91 9876543212" }
  ],
  attendance: {}, // teamId -> { status: 'Present'|'Absent'|'Late', checkInTime: timestamp, membersPresent: 2, notes: '' }
  round1: {}, // teamId -> { rawTimeMs, penalties, penaltySeconds, finalTimeMs, disqualified, dqReason, arena, judgeName }
  round2: {},
  round3: {
    matches: {
      M1: { id: "M1", stage: "Play-in Match", matchUp: "Seed 8 vs Seed 9", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M2: { id: "M2", stage: "Quarterfinal 1 (QF1)", matchUp: "Seed 1 vs Winner M1", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M3: { id: "M3", stage: "Quarterfinal 2 (QF2)", matchUp: "Seed 4 vs Seed 5", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M4: { id: "M4", stage: "Quarterfinal 3 (QF3)", matchUp: "Seed 3 vs Seed 6", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M5: { id: "M5", stage: "Quarterfinal 4 (QF4)", matchUp: "Seed 2 vs Seed 7", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M6: { id: "M6", stage: "Semifinal 1 (SF1)", matchUp: "Winner QF1 vs Winner QF2", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M7: { id: "M7", stage: "Semifinal 2 (SF2)", matchUp: "Winner QF3 vs Winner QF4", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M8: { id: "M8", stage: "3rd Place Match", matchUp: "Loser SF1 vs Loser SF2", teamA: null, teamB: null, winner: null, reason: "", dq: false },
      M9: { id: "M9", stage: "Final", matchUp: "Winner SF1 vs Winner SF2", teamA: null, teamB: null, winner: null, reason: "", dq: false }
    }
  }
};

let storeState = JSON.parse(JSON.stringify(defaultState));

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      storeState = JSON.parse(raw);
      if (!storeState.judges) storeState.judges = defaultState.judges;
      if (!storeState.attendance) storeState.attendance = {};
    } else {
      seedDefaultTeams();
    }
  } catch (e) {
    console.error("Failed to load store:", e);
    storeState = JSON.parse(JSON.stringify(defaultState));
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
  } catch (e) {
    console.error("Failed to save store:", e);
  }
}

function resetStore() {
  localStorage.removeItem(STORAGE_KEY);
  storeState = JSON.parse(JSON.stringify(defaultState));
  seedDefaultTeams();
  saveStore();
}

function seedDefaultTeams() {
  const colleges = ["SRMIST", "VIT Vellore", "IIT Madras", "NIT Trichy", "SSN College", "SASTRA Univ", "PSG Tech", "Anna University"];
  const botNames = [
    "ViperBot", "Apex Rover", "TitanX", "Cyclone 2.0", "Phantom Rider", 
    "Shadow Crawler", "Blaze X", "Storm Breaker", "Velocity Prime", "Iron Clad",
    "Omega Trail", "Nebula", "Xeno Drive", "Hyperion", "Pulse Rover",
    "Aero Crawler", "Thunder Bolt", "Vortex 9", "Stinger", "Torque Force"
  ];

  storeState.teams = [];
  storeState.attendance = {};

  for (let i = 1; i <= 58; i++) {
    const botNum = String(i).padStart(3, '0');
    const botId = `BOT-${botNum}`;
    const botName = botNames[(i - 1) % botNames.length] + ` #${i}`;
    const college = colleges[(i - 1) % colleges.length];
    
    // Default 50 passed eligibility, 8 pending
    const passed = i <= 50;

    storeState.teams.push({
      id: botId,
      name: botName,
      institution: college,
      members: [`Lead ${i}`, `Member ${i}A`],
      arena: i % 2 === 1 ? 'A' : 'B',
      eligibility: {
        dimensions: passed,
        weight: passed,
        voltage: passed,
        driveType: passed,
        bodyOrigin: passed,
        wiredControl: passed,
        wirelessControl: passed,
        bannedParts: passed,
        teamMembers: passed,
        dedicatedTxRx: passed,
        passed: passed,
        notes: passed ? "All 10 tech inspection checks verified" : "Pending tech check"
      }
    });

    // Default attendance: first 45 Present, 8 Late, 5 Absent
    let attStatus = 'Present';
    if (i > 45 && i <= 53) attStatus = 'Late';
    if (i > 53) attStatus = 'Absent';

    storeState.attendance[botId] = {
      status: attStatus,
      checkInTime: attStatus !== 'Absent' ? (Date.now() - (i * 60000)) : null,
      membersPresent: attStatus === 'Absent' ? 0 : 2,
      notes: attStatus === 'Late' ? 'Arrived at desk post 09:30 AM' : 'Standard check-in'
    };
  }
  saveStore();
}

// Initial load
loadStore();
