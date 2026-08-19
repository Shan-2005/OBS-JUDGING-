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
  console.log("🚀 Pushing data directly to Supabase REST API...");

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(mockTeams)
    });

    if (res.ok) {
      console.log("✅ Successfully pushed 58 teams to Supabase cloud database!");
    } else {
      const errText = await res.text();
      console.log("Response note:", res.status, errText);
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

pushData();
