const SUPABASE_URL = process.env.SUPABASE_URL || "https://kcpgzjkhsirypbldukuc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Fv6dmWZanAAxluu0w7A58Q_zgthZFGX";

const mockTeams = Array.from({ length: 58 }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  const arena = i % 2 === 0 ? 'A' : 'B';
  return {
    bot_id: `BOT-${num}`,
    team_name: `Team ${num}`,
    institution: `Institution ${(i % 10) + 1}`,
    arena: arena,
    members: `Member ${num}-1, Member ${num}-2`,
    attendance_status: 'Present',
    tech_check_passed: true,
    round1_final_ms: null,
    round2_final_ms: null
  };
});

async function pushData() {
  console.log("🚀 Pushing 58 teams to Supabase REST API...");

  try {
    // 1. Push Teams Table
    const resTeams = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(mockTeams)
    });

    if (resTeams.ok) {
      console.log("✅ Successfully pushed 58 teams to 'teams' table!");
    } else {
      console.log("Teams note:", resTeams.status, await resTeams.text());
    }

    // 2. Push Judging Portal State Table
    const masterStatePayload = {
      id: "robofest_master_state",
      state_data: {
        initialized: true,
        teams: mockTeams,
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
      body: JSON.stringify([masterStatePayload])
    });

    if (resState.ok) {
      console.log("✅ Successfully pushed master state to 'judging_portal_state' table!");
    } else {
      console.log("State note:", resState.status, await resState.text());
    }

  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

pushData();
