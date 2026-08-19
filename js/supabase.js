/* ==========================================================================
   ROBOFEST 2.0 - SUPABASE CLOUD DATABASE SYNC & PARTICIPANTS PUSH
   ========================================================================== */

const SUPABASE_URL = "https://kcpgzjkhsirypbldukuc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fv6dmWZanAAxluu0w7A58Q_zgthZFGX";

let supabaseClient = null;
let isCloudOnline = false;
let realTimeChannel = null;

function initSupabase() {
  if (typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isCloudOnline = true;
      console.log("Supabase Client connected successfully!");
      updateCloudSyncBadge(true);
      setupRealtimeSubscriptions();
      fetchInitialState();
    } catch (err) {
      console.warn("Supabase init error:", err);
      updateCloudSyncBadge(false);
    }
  } else {
    updateCloudSyncBadge(false);
  }
}

function updateCloudSyncBadge(online) {
  const badge = document.getElementById('cloud-sync-status-badge');
  if (badge) {
    if (online) {
      badge.className = "badge badge-success";
      badge.innerHTML = "☁️ Supabase Real-time Active";
    } else {
      badge.className = "badge badge-warning";
      badge.innerHTML = "💾 LocalStorage Offline Mode";
    }
  }
}

let lastSyncedLocalState = "";
let lastLocalSaveTimestamp = 0;
let syncDebounceTimer = null;

function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  try {
    realTimeChannel = supabaseClient.channel('public:obs_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judging_portal_state' }, payload => {
        // Ignore real-time echoes for 2.5 seconds after local edit to prevent Supabase round-trip loop glitching
        if (Date.now() - lastLocalSaveTimestamp < 2500) {
          return;
        }

        if (payload.new && payload.new.state_data) {
          const cloudStr = JSON.stringify(payload.new.state_data);
          const localStr = JSON.stringify(storeState);

          if (cloudStr !== localStr && cloudStr !== lastSyncedLocalState) {
            storeState = payload.new.state_data;
            lastSyncedLocalState = cloudStr;
            saveStoreLocallyOnly();
            if (typeof refreshAllViews === 'function') refreshAllViews();
          }
        }
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime subscription warning:", err);
  }
}

async function fetchInitialState() {
  if (!supabaseClient || !isCloudOnline) return;
  try {
    const { data } = await supabaseClient
      .from('judging_portal_state')
      .select('state_data')
      .eq('id', 'robofest_master_state')
      .single();

    if (data && data.state_data) {
      const cloudStr = JSON.stringify(data.state_data);
      const localStr = JSON.stringify(storeState);
      if (cloudStr !== localStr) {
        storeState = data.state_data;
        lastSyncedLocalState = cloudStr;
        saveStoreLocallyOnly();
        if (typeof refreshAllViews === 'function') refreshAllViews();
        console.log("✅ Successfully initialized local store from Supabase master state!");
      }
    }
  } catch (err) {
    console.warn("Failed to load initial state from Supabase, using local storage:", err);
  }
}

function syncDataToCloud() {
  lastLocalSaveTimestamp = Date.now();
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  syncDebounceTimer = setTimeout(async () => {
    if (!supabaseClient || !isCloudOnline) return;

    try {
      lastSyncedLocalState = JSON.stringify(storeState);

      // 1. Sync full master state
      const masterPayload = {
        id: 'robofest_master_state',
        state_data: storeState,
        updated_at: new Date().toISOString()
      };

      await supabaseClient
        .from('judging_portal_state')
        .upsert(masterPayload);

      // 2. Push participants & teams details to Supabase teams table
      await pushParticipantsToSupabase();
    } catch (err) {
      console.warn("Cloud sync network error:", err);
    }
  }, 500);
}

async function pushParticipantsToSupabase() {
  if (!supabaseClient || !isCloudOnline) return;

  try {
    const teamsList = storeState.teams.map(t => {
      const run1 = storeState.round1[t.id];
      const run2 = storeState.round2[t.id];
      const att = storeState.attendance[t.id];

      return {
        bot_id: t.id,
        team_name: t.name,
        institution: t.institution,
        arena: t.arena,
        members: t.members ? t.members.join(', ') : '',
        attendance_status: att ? att.status : 'Absent',
        tech_check_passed: t.eligibility ? t.eligibility.passed : false,
        round1_final_ms: run1 ? run1.finalTimeMs : null,
        round2_final_ms: run2 ? run2.finalTimeMs : null,
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabaseClient
      .from('teams')
      .upsert(teamsList, { onConflict: 'bot_id' });

    if (error) {
      console.warn("Supabase teams table upsert note:", error.message);
    } else {
      console.log("Pushed 58 participant records to Supabase cloud table!");
    }
  } catch (err) {
    console.warn("Push participants error:", err);
  }
}

async function pollStateFromCloud() {
  if (!supabaseClient || !isCloudOnline) return;

  try {
    const { data } = await supabaseClient
      .from('judging_portal_state')
      .select('state_data')
      .eq('id', 'robofest_master_state')
      .single();

    if (data && data.state_data) {
      const cloudStr = JSON.stringify(data.state_data);
      const localStr = JSON.stringify(storeState);
      if (cloudStr !== localStr) {
        storeState = data.state_data;
        saveStoreLocallyOnly();
        if (typeof refreshAllViews === 'function') refreshAllViews();
      }
    }
  } catch (err) {
    // Failover to local storage
  }
}

function saveStoreLocallyOnly() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
  } catch (e) {
    console.error(e);
  }
}

// Initialize on load
window.addEventListener('load', () => {
  initSupabase();
});
