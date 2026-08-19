import fs from 'fs';
import path from 'path';

const csvPath = 'C:\\Users\\areoj\\Downloads\\obs-rb2-event-teams-6-aug-2026-1958.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Regex for CSV split handling quotes
    const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const cleanRow = row.map(cell => cell.trim().replace(/^"|"$/g, ''));
    
    if (cleanRow.length >= 2) {
      records.push({
        raw_uuid: cleanRow[0],
        team_name: cleanRow[1],
        leader_name: cleanRow[2] || '',
        leader_email: cleanRow[3] || '',
        leader_phone: cleanRow[4] || '',
        roster_size: cleanRow[5] || '3'
      });
    }
  }
  return records;
}

const records = parseCSV(csvContent);

console.log(`Loaded ${records.length} official teams from CSV!`);

const officialTeams = records.map((r, i) => {
  const num = String(i + 1).padStart(3, '0');
  const arena = i % 2 === 0 ? 'A' : 'B';
  let inst = "RoboFest Participant";
  if (r.leader_email.includes('srm')) inst = "SRMIST";
  else if (r.leader_email.includes('vit')) inst = "VIT University";
  else if (r.leader_email.includes('ssn')) inst = "SSN College of Engineering";
  else if (r.leader_email.includes('sairam')) inst = "Sairam Vidyalaya";
  else if (r.leader_email.includes('aditya')) inst = "Aditya University";
  else if (r.leader_email.includes('kiet')) inst = "KIET Group of Institutions";
  else if (r.leader_email.includes('dsce')) inst = "DSCE Bangalore";
  else if (r.leader_email.includes('bloomingdale')) inst = "Bloomingdale International";
  else if (r.team_name.includes('SRM')) inst = "SRM School";
  else if (r.team_name.includes('Bodhi')) inst = "Bodhi International";

  const members = r.leader_name ? [r.leader_name, `Member 2`, `Member 3`] : [`Member 1`, `Member 2`].slice(0, parseInt(r.roster_size) || 3);

  return {
    id: `BOT-${num}`,
    rawUuid: r.raw_uuid,
    name: r.team_name,
    institution: inst,
    leaderName: r.leader_name,
    leaderEmail: r.leader_email,
    leaderPhone: r.leader_phone,
    members: members,
    arena: arena,
    eligibility: { passed: false, checkedAt: null, notes: '' }
  };
});

// Write to JSON file for reference
fs.writeFileSync('d:\\obs_judging\\official_teams.json', JSON.stringify(officialTeams, null, 2));

// Push directly to Supabase via REST API
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kcpgzjkhsirypbldukuc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Fv6dmWZanAAxluu0w7A58Q_zgthZFGX";

async function pushOfficialToSupabase() {
  console.log("🚀 Pushing official 58 CSV teams to Supabase...");

  const supabaseTeams = officialTeams.map(t => ({
    bot_id: t.id,
    team_name: t.name,
    institution: t.institution,
    arena: t.arena,
    members: t.members.join(', '),
    attendance_status: 'Absent',
    tech_check_passed: false,
    round1_final_ms: null,
    round2_final_ms: null
  }));

  try {
    const resTeams = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(supabaseTeams)
    });

    if (resTeams.ok) {
      console.log("✅ Successfully updated Supabase 'teams' table with official CSV teams!");
    } else {
      console.log("Teams note:", resTeams.status, await resTeams.text());
    }

    const masterPayload = {
      id: "robofest_master_state",
      state_data: {
        initialized: true,
        teams: officialTeams,
        attendance: {},
        judges: [],
        round1: {},
        round2: {},
        round3: { matches: {} }
      },
      updated_at: new Date().toISOString()
    };

    const resState = await fetch(`${SUPABASE_URL}/rest/v1/judging_portal_state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify([masterPayload])
    });

    if (resState.ok) {
      console.log("✅ Successfully updated Supabase 'judging_portal_state' table with official CSV state!");
    } else {
      console.log("State note:", resState.status, await resState.text());
    }

  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

pushOfficialToSupabase();
