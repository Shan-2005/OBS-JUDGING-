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
      if (!storeState.round1) storeState.round1 = {};
      if (!storeState.round2) storeState.round2 = {};
      if (!storeState.round3) storeState.round3 = JSON.parse(JSON.stringify(defaultState.round3));
      if (!storeState.round3.matches) storeState.round3.matches = JSON.parse(JSON.stringify(defaultState.round3.matches));
      if (!storeState.teams || storeState.teams.length === 0) {
        seedDefaultTeams();
      }
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
    if (typeof syncDataToCloud === 'function') {
      syncDataToCloud();
    }
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
  const officialCsvList = [
    { name: "SRM School TEAM13", inst: "SRM School", leader: "3" },
    { name: "SRM School TEAM12", inst: "SRM School", leader: "4" },
    { name: "SRM School TEAM14", inst: "SRM School", leader: "4" },
    { name: "SRM School TEAM11", inst: "SRM School", leader: "1" },
    { name: "SRM School TEAM15", inst: "SRM School", leader: "2" },
    { name: "Python Riders", inst: "SRMIST", leader: "A Mukilan" },
    { name: "Bodhians", inst: "Bodhi International", leader: "Robin" },
    { name: "IMEC - 3", inst: "RoboFest Participant", leader: "R V V S D Prabhu Ram" },
    { name: "IMEC - 2", inst: "Aditya University", leader: "N Veda Santhosh" },
    { name: "IMEC-1", inst: "RoboFest Participant", leader: "M khusal" },
    { name: "Bodhispark", inst: "Bodhi International", leader: "narvin" },
    { name: "Bodhibots", inst: "Bodhi International", leader: "Dharsan" },
    { name: "Robotitans", inst: "RoboFest Participant", leader: "bodhischoolsvga" },
    { name: "Nura Robotics", inst: "RoboFest Participant", leader: "Tamizharasan K" },
    { name: "Bionary VITC", inst: "RoboFest Participant", leader: "Shashanka Shekhar Nayak" },
    { name: "NEXORA", inst: "RoboFest Participant", leader: "Sivanesh D" },
    { name: "ROBOTIC RANGERS", inst: "RoboFest Participant", leader: "Gayathri" },
    { name: "Eric Rc hobbies", inst: "RoboFest Participant", leader: "Eric Samuel" },
    { name: "Gravity", inst: "VIT University", leader: "ashwinkumar.vm2024" },
    { name: "Ds Robotics", inst: "RoboFest Participant", leader: "Yuvanesh Balaji" },
    { name: "Akatsuki", inst: "KIET Group of Institutions", leader: "Devesh Kumar" },
    { name: "NitroBot", inst: "RoboFest Participant", leader: "Amogh Betageri" },
    { name: "LATENCY ZERO", inst: "DSCE Bangalore", leader: "Selva Ganapathi" },
    { name: "Satecbot", inst: "RoboFest Participant", leader: "Mohammed Ashraf Roshan s" },
    { name: "TORQUE TITANS", inst: "RoboFest Participant", leader: "JEEVAN VK" },
    { name: "Draco bots", inst: "RoboFest Participant", leader: "Vignesh S" },
    { name: "Draxis", inst: "RoboFest Participant", leader: "Vedanth" },
    { name: "Pathfinders", inst: "VIT University", leader: "Muthiah Karthik" },
    { name: "Valthukal valthukal", inst: "RoboFest Participant", leader: "sidharthan.b02" },
    { name: "Vector Evasions", inst: "RoboFest Participant", leader: "K JAHNAVI" },
    { name: "Stealth Strikers", inst: "RoboFest Participant", leader: "Alankritha" },
    { name: "heisenberg", inst: "Sairam Vidyalaya", leader: "MUKUNTHAN A" },
    { name: "Apex Point", inst: "RoboFest Participant", leader: "Midun Surya T" },
    { name: "Cyber spirits", inst: "VIT University", leader: "Rahul" },
    { name: "MechaTech", inst: "RoboFest Participant", leader: "Akshith seemala" },
    { name: "Robo blitz league", inst: "RoboFest Participant", leader: "Roma Ram" },
    { name: "Ghost Rider", inst: "RoboFest Participant", leader: "Abhav Krishna S" },
    { name: "Titan", inst: "RoboFest Participant", leader: "G L Thanwin" },
    { name: "LPL Squad", inst: "RoboFest Participant", leader: "S Levin Ronald" },
    { name: "Zenvaa Technologies", inst: "RoboFest Participant", leader: "V M Avinash" },
    { name: "The Glitch kings", inst: "RoboFest Participant", leader: "saranyamithunya" },
    { name: "Rohith’s Race", inst: "RoboFest Participant", leader: "aashrithat" },
    { name: "Angry Bird", inst: "Bloomingdale International", leader: "Havinthika AS" },
    { name: "Route Rangers", inst: "SSN College of Engineering", leader: "Kishore Ram S" },
    { name: "Voltage vipers", inst: "RoboFest Participant", leader: "Lakshith" },
    { name: "Tokyo Drifters", inst: "SSN College of Engineering", leader: "PRANAV TV" },
    { name: "RTJ AUTOBOYS", inst: "RoboFest Participant", leader: "S.Rohith" },
    { name: "YHSC BOT CREATORS VELS", inst: "RoboFest Participant", leader: "Sarvesh S" },
    { name: "Samurai blue", inst: "RoboFest Participant", leader: "Hariram" },
    { name: "Techno Titans", inst: "RoboFest Participant", leader: "Lithura Anbukrishnan" },
    { name: "Thunderstrike", inst: "RoboFest Participant", leader: "tharshan ms" },
    { name: "Solo Protocol", inst: "RoboFest Participant", leader: "Siri.V" },
    { name: "Velocity Vortex", inst: "RoboFest Participant", leader: "SAI MIRA BASKARAN" },
    { name: "Track OFF", inst: "RoboFest Participant", leader: "M Mohammed Anwar" },
    { name: "Odyssey sciences", inst: "RoboFest Participant", leader: "Sai srinivas" },
    { name: "RODIX", inst: "RoboFest Participant", leader: "dixittharunraja" },
    { name: "Drift Dynamix", inst: "RoboFest Participant", leader: "KV Keshav" },
    { name: "Shadowx", inst: "RoboFest Participant", leader: "AryaPatel" }
  ];

  storeState.teams = [];
  storeState.attendance = {};

  officialCsvList.forEach((item, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const botId = `BOT-${num}`;
    
    const emptyEligibility = {
      dimensions: false,
      weight: false,
      voltage: false,
      driveType: false,
      bodyOrigin: false,
      wiredControl: false,
      wirelessControl: false,
      bannedParts: false,
      teamMembers: false,
      dedicatedTxRx: false,
      passed: false,
      notes: "Tech check pending"
    };

    storeState.teams.push({
      id: botId,
      name: item.name,
      institution: item.inst,
      members: [item.leader || `Lead ${idx + 1}`, `Member 2`],
      arena: idx % 2 === 0 ? 'A' : 'B',
      eligibility_r1: JSON.parse(JSON.stringify(emptyEligibility)),
      eligibility_r2: JSON.parse(JSON.stringify(emptyEligibility)),
      eligibility_r3: JSON.parse(JSON.stringify(emptyEligibility)),
      // Legacy compatibility
      eligibility: JSON.parse(JSON.stringify(emptyEligibility))
    });
  });

  saveStore();
}

// Initial load
loadStore();
