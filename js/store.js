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

const officialCsvList = [
  {
    "name": "SRM School TEAM13",
    "inst": "SRM School",
    "leader": "Lead (SRM School TEAM13)",
    "email": "",
    "phone": "",
    "rosterSize": 3
  },
  {
    "name": "SRM School TEAM12",
    "inst": "SRM School",
    "leader": "Lead (SRM School TEAM12)",
    "email": "",
    "phone": "",
    "rosterSize": 4
  },
  {
    "name": "SRM School TEAM14",
    "inst": "SRM School",
    "leader": "Lead (SRM School TEAM14)",
    "email": "",
    "phone": "",
    "rosterSize": 4
  },
  {
    "name": "SRM School TEAM11",
    "inst": "SRM School",
    "leader": "Lead (SRM School TEAM11)",
    "email": "",
    "phone": "",
    "rosterSize": 1
  },
  {
    "name": "SRM School TEAM15",
    "inst": "SRM School",
    "leader": "Lead (SRM School TEAM15)",
    "email": "",
    "phone": "",
    "rosterSize": 2
  },
  {
    "name": "Python Riders",
    "inst": "SRMIST",
    "leader": "A Mukilan",
    "email": "ar8173@srmist.edu.in",
    "phone": "+919944583116",
    "rosterSize": 4
  },
  {
    "name": "Bodhians",
    "inst": "Bodhi International",
    "leader": "Robin",
    "email": "appsinboxs@gmail.com",
    "phone": "+919940263639",
    "rosterSize": 4
  },
  {
    "name": "IMEC - 3",
    "inst": "RoboFest Participant",
    "leader": "R V V S D Prabhu Ram",
    "email": "reddyprabhuram25@gmail.com",
    "phone": "+919398572803",
    "rosterSize": 4
  },
  {
    "name": "IMEC - 2",
    "inst": "Aditya University",
    "leader": "N Veda Santhosh",
    "email": "24b11ec199@adityauniversity.in",
    "phone": "+918367630087",
    "rosterSize": 4
  },
  {
    "name": "IMEC-1",
    "inst": "RoboFest Participant",
    "leader": "M khusal",
    "email": "khusalkumar26@gmail.com",
    "phone": "+918074678911",
    "rosterSize": 4
  },
  {
    "name": "Bodhispark",
    "inst": "Bodhi International",
    "leader": "narvin",
    "email": "finance.bodhischool@gmail.com",
    "phone": "+919790841231",
    "rosterSize": 4
  },
  {
    "name": "Bodhibots",
    "inst": "Bodhi International",
    "leader": "Dharsan",
    "email": "rajan4j@gmail.com",
    "phone": "+919444323322",
    "rosterSize": 4
  },
  {
    "name": "Robotitans",
    "inst": "RoboFest Participant",
    "leader": "bodhischoolsvga",
    "email": "bodhischoolsvga@gmail.com",
    "phone": "+919940263639",
    "rosterSize": 4
  },
  {
    "name": "Nura Robotics",
    "inst": "RoboFest Participant",
    "leader": "Tamizharasan K",
    "email": "tamizharasank6030@gmail.com",
    "phone": "+918438686030",
    "rosterSize": 2
  },
  {
    "name": "Bionary VITC",
    "inst": "RoboFest Participant",
    "leader": "Shashanka Shekhar Nayak",
    "email": "shashankashekharnayak2006@gmail.com",
    "phone": "+919631207662",
    "rosterSize": 3
  },
  {
    "name": "NEXORA",
    "inst": "RoboFest Participant",
    "leader": "Sivanesh D",
    "email": "sivanesh20160999@gmail.com",
    "phone": "+919884850863",
    "rosterSize": 4
  },
  {
    "name": "ROBOTIC RANGERS",
    "inst": "RoboFest Participant",
    "leader": "Gayathri",
    "email": "p8350949@gmail.com",
    "phone": "+918015512041",
    "rosterSize": 4
  },
  {
    "name": "Eric Rc hobbies",
    "inst": "RoboFest Participant",
    "leader": "Eric Samuel",
    "email": "edison.holyangels@gmail.com",
    "phone": "+919930353542",
    "rosterSize": 1
  },
  {
    "name": "Gravity",
    "inst": "VIT University",
    "leader": "ashwinkumar.vm2024",
    "email": "ashwinkumar.vm2024@vitstudent.ac.in",
    "phone": "+918072069403",
    "rosterSize": 4
  },
  {
    "name": "Ds Robotics",
    "inst": "RoboFest Participant",
    "leader": "Yuvanesh Balaji",
    "email": "yuvniconnect@gmail.com",
    "phone": "+919944583134",
    "rosterSize": 3
  },
  {
    "name": "Akatsuki",
    "inst": "KIET Group of Institutions",
    "leader": "Devesh Kumar",
    "email": "devesh.25007064@kiet.edu",
    "phone": "+919457518737",
    "rosterSize": 2
  },
  {
    "name": "NitroBot",
    "inst": "RoboFest Participant",
    "leader": "Amogh Betageri",
    "email": "amoghbetageri@gmail.com",
    "phone": "+919148066418",
    "rosterSize": 4
  },
  {
    "name": "LATENCY ZERO",
    "inst": "DSCE Bangalore",
    "leader": "Selva Ganapathi",
    "email": "1ds25ri403@dsce.edu.in",
    "phone": "+917892176933",
    "rosterSize": 4
  },
  {
    "name": "Satecbot",
    "inst": "RoboFest Participant",
    "leader": "Mohammed Ashraf Roshan s",
    "email": "ashrafroshan046@gmail.com",
    "phone": "+918870247995",
    "rosterSize": 4
  },
  {
    "name": "TORQUE TITANS",
    "inst": "RoboFest Participant",
    "leader": "JEEVAN VK",
    "email": "jeevanvk.22@gmail.com",
    "phone": "+919444992572",
    "rosterSize": 4
  },
  {
    "name": "Draco bots",
    "inst": "RoboFest Participant",
    "leader": "Vignesh S",
    "email": "gokulban1624@gmail.com",
    "phone": "+918438079969",
    "rosterSize": 2
  },
  {
    "name": "Draxis",
    "inst": "RoboFest Participant",
    "leader": "Vedanth",
    "email": "vedanth.k.engr@gmail.com",
    "phone": "+918248849332",
    "rosterSize": 3
  },
  {
    "name": "Pathfinders",
    "inst": "VIT University",
    "leader": "Muthiah Karthik",
    "email": "muthiahkarthik.s2024@vitstudent.ac.in",
    "phone": "+918838296344",
    "rosterSize": 3
  },
  {
    "name": "Valthukal valthukal",
    "inst": "RoboFest Participant",
    "leader": "sidharthan.b02",
    "email": "sidharthan.b02@gmail.com",
    "phone": "+918807613485",
    "rosterSize": 3
  },
  {
    "name": "Vector Evasions",
    "inst": "RoboFest Participant",
    "leader": "K JAHNAVI",
    "email": "nharitha3@gmail.com",
    "phone": "+919176661155",
    "rosterSize": 3
  },
  {
    "name": "Stealth Strikers",
    "inst": "RoboFest Participant",
    "leader": "Alankritha",
    "email": "aluridhu@gmail.com",
    "phone": "+919952965326",
    "rosterSize": 4
  },
  {
    "name": "heisenberg",
    "inst": "Sairam Vidyalaya",
    "leader": "MUKUNTHAN A",
    "email": "mpv26ha010@sairamvidyalaya.edu.in",
    "phone": "+918148563287",
    "rosterSize": 4
  },
  {
    "name": "Apex Point",
    "inst": "RoboFest Participant",
    "leader": "Midun Surya T",
    "email": "25ec409@skcet.ac.in",
    "phone": "+919791247646",
    "rosterSize": 4
  },
  {
    "name": "Cyber spirits",
    "inst": "VIT University",
    "leader": "Rahul",
    "email": "kavitharahul838@gmail.com",
    "phone": "+919840732205",
    "rosterSize": 3
  },
  {
    "name": "MechaTech",
    "inst": "RoboFest Participant",
    "leader": "Akshith seemala",
    "email": "arutisan@gmail.com",
    "phone": "+919176614076",
    "rosterSize": 3
  },
  {
    "name": "Robo blitz league",
    "inst": "RoboFest Participant",
    "leader": "Roma Ram",
    "email": "divcs89@gmail.com",
    "phone": "+919789030290",
    "rosterSize": 2
  },
  {
    "name": "Ghost Rider",
    "inst": "RoboFest Participant",
    "leader": "Abhav Krishna S",
    "email": "shyam.sukumaran@gmail.com",
    "phone": "+919962646354",
    "rosterSize": 1
  },
  {
    "name": "Titan",
    "inst": "RoboFest Participant",
    "leader": "G L Thanwin",
    "email": "vvd.3976@velsvidyashram.ac.in",
    "phone": "+919884362227",
    "rosterSize": 2
  },
  {
    "name": "LPL Squad",
    "inst": "RoboFest Participant",
    "leader": "S Levin Ronald",
    "email": "slevinronald@gmail.com",
    "phone": "+919884481829",
    "rosterSize": 3
  },
  {
    "name": "Zenvaa Technologies",
    "inst": "RoboFest Participant",
    "leader": "V M Avinash",
    "email": "0521avinash@gmail.com",
    "phone": "+919245205200",
    "rosterSize": 3
  },
  {
    "name": "The Glitch kings",
    "inst": "RoboFest Participant",
    "leader": "saranyamithunya",
    "email": "saranyamithunya@gmail.com",
    "phone": "+917305332659",
    "rosterSize": 2
  },
  {
    "name": "Rohith’s Race",
    "inst": "RoboFest Participant",
    "leader": "aashrithat",
    "email": "aashrithat@gmail.com",
    "phone": "+918056221884",
    "rosterSize": 1
  },
  {
    "name": "Angry Bird",
    "inst": "Bloomingdale International",
    "leader": "Havinthika AS",
    "email": "bisdesign_facilitator4@bloomingdale.edu.in",
    "phone": "+919629361818",
    "rosterSize": 1
  },
  {
    "name": "Route Rangers",
    "inst": "SSN College of Engineering",
    "leader": "Kishore Ram S",
    "email": "kishoreram2410104@ssn.edu.in",
    "phone": "+919445927575",
    "rosterSize": 4
  },
  {
    "name": "Voltage vipers",
    "inst": "RoboFest Participant",
    "leader": "Lakshith",
    "email": "sarvan.ece@gmail.com",
    "phone": "+919789091132",
    "rosterSize": 2
  },
  {
    "name": "Tokyo Drifters",
    "inst": "SSN College of Engineering",
    "leader": "PRANAV TV",
    "email": "pranav2410513@ssn.edu.in",
    "phone": "+918056257593",
    "rosterSize": 4
  },
  {
    "name": "RTJ AUTOBOYS",
    "inst": "RoboFest Participant",
    "leader": "S.Rohith",
    "email": "shreeingame@gmail.com",
    "phone": "+919677106952",
    "rosterSize": 3
  },
  {
    "name": "YHSC BOT CREATORS VELS",
    "inst": "RoboFest Participant",
    "leader": "Sarvesh S",
    "email": "harshinishree4321@gmail.com",
    "phone": "+919952660193",
    "rosterSize": 4
  },
  {
    "name": "Samurai blue",
    "inst": "RoboFest Participant",
    "leader": "Hariram",
    "email": "animax0070707@gmail.com",
    "phone": "+919941006862",
    "rosterSize": 4
  },
  {
    "name": "Techno Titans",
    "inst": "RoboFest Participant",
    "leader": "Lithura Anbukrishnan",
    "email": "kanimozhi1982@gmail.com",
    "phone": "+919994087377",
    "rosterSize": 2
  },
  {
    "name": "Thunderstrike",
    "inst": "RoboFest Participant",
    "leader": "tharshan ms",
    "email": "smuniapp@gmail.com",
    "phone": "+919092222524",
    "rosterSize": 2
  },
  {
    "name": "Solo Protocol",
    "inst": "RoboFest Participant",
    "leader": "Siri.V",
    "email": "bhagyasiriv672@gmail.com",
    "phone": "+919059104812",
    "rosterSize": 1
  },
  {
    "name": "Velocity Vortex",
    "inst": "RoboFest Participant",
    "leader": "SAI MIRA BASKARAN",
    "email": "dsarala83@gmail.com",
    "phone": "+919841416015",
    "rosterSize": 3
  },
  {
    "name": "Track OFF",
    "inst": "RoboFest Participant",
    "leader": "M Mohammed Anwar",
    "email": "mohammedanwar6mars.16@gmail.com",
    "phone": "+919539356429",
    "rosterSize": 2
  },
  {
    "name": "Odyssey sciences",
    "inst": "RoboFest Participant",
    "leader": "Sai srinivas",
    "email": "ssssaisrini@gmail.com",
    "phone": "+919791094009",
    "rosterSize": 3
  },
  {
    "name": "RODIX",
    "inst": "RoboFest Participant",
    "leader": "dixittharunraja",
    "email": "dixittharunraja@gmail.com",
    "phone": "+919597527581",
    "rosterSize": 1
  },
  {
    "name": "Drift Dynamix",
    "inst": "RoboFest Participant",
    "leader": "KV Keshav",
    "email": "kv.keshav2011@gmail.com",
    "phone": "+919840165017",
    "rosterSize": 3
  },
  {
    "name": "Shadowx",
    "inst": "RoboFest Participant",
    "leader": "AryaPatel",
    "email": "aryapatel0311@gmail.com",
    "phone": "+918460518625",
    "rosterSize": 5
  }
];

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
      if (!storeState.teams || storeState.teams.length < officialCsvList.length) {
        seedDefaultTeams();
      } else {
        storeState.teams.forEach((t, idx) => {
          const csvMeta = officialCsvList[idx];
          if (csvMeta) {
            t.rosterSize = csvMeta.rosterSize || t.rosterSize || 1;
            if (csvMeta.leader) t.leader = csvMeta.leader;
            if (csvMeta.email) t.email = csvMeta.email;
            if (csvMeta.phone) t.phone = csvMeta.phone;
          }
          if (!storeState.attendance[t.id]) {
            storeState.attendance[t.id] = {
              status: 'Absent',
              checkInTime: null,
              membersPresent: t.rosterSize || 1,
              maxMembers: t.rosterSize || 1,
              notes: ''
            };
          } else {
            storeState.attendance[t.id].maxMembers = t.rosterSize || 1;
          }
        });
      }
    } else {
      seedDefaultTeams();
    }
  } catch (e) {
    console.error("Failed to load store:", e);
    storeState = JSON.parse(JSON.stringify(defaultState));
    seedDefaultTeams();
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
  if (!storeState.teams || storeState.teams.length === 0) {
    storeState.teams = [];
  }
  if (!storeState.attendance) storeState.attendance = {};

  officialCsvList.forEach((item, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const botId = `BOT-${num}`;
    
    let existingTeam = storeState.teams.find(t => t.id === botId);

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

    const rSize = item.rosterSize || 1;
    const memberList = [];
    const leadName = item.leader || `Lead (${item.name})`;
    memberList.push(leadName);
    for (let m = 2; m <= rSize; m++) {
      memberList.push(`Member ${m}`);
    }

    if (!existingTeam) {
      storeState.teams.push({
        id: botId,
        name: item.name,
        institution: item.inst,
        leader: leadName,
        email: item.email || '',
        phone: item.phone || '',
        rosterSize: rSize,
        members: memberList,
        arena: idx % 2 === 0 ? 'A' : 'B',
        eligibility_r1: JSON.parse(JSON.stringify(emptyEligibility)),
        eligibility_r2: JSON.parse(JSON.stringify(emptyEligibility)),
        eligibility_r3: JSON.parse(JSON.stringify(emptyEligibility)),
        eligibility: JSON.parse(JSON.stringify(emptyEligibility))
      });
    } else {
      existingTeam.name = item.name;
      existingTeam.institution = item.inst;
      existingTeam.rosterSize = rSize;
      if (item.leader) existingTeam.leader = item.leader;
      if (item.email) existingTeam.email = item.email;
      if (item.phone) existingTeam.phone = item.phone;
    }

    if (!storeState.attendance[botId]) {
      storeState.attendance[botId] = {
        status: 'Absent',
        checkInTime: null,
        membersPresent: rSize,
        maxMembers: rSize,
        notes: ''
      };
    }
  });

  saveStore();
}

// Initial load
loadStore();

