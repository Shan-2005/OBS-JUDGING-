/* ==========================================================================
   ROBOFEST 2.0 - SUPABASE HYBRID REAL-TIME MULTI-JUDGE SYNC ENGINE
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
      console.log("Supabase Client initialized!");
      updateCloudSyncBadge(true);
      setupRealtimeSubscriptions();
    } catch (err) {
      console.warn("Supabase init failed, running in Offline LocalStorage mode.", err);
      updateCloudSyncBadge(false);
    }
  } else {
    console.warn("Supabase SDK CDN not loaded, running in Offline LocalStorage mode.");
    updateCloudSyncBadge(false);
  }

  // Multi-judge polling fallback every 3 seconds for active sync across all judges
  setInterval(pollStateFromCloud, 3000);
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

function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  try {
    realTimeChannel = supabaseClient.channel('public:obs_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judging_portal_state' }, payload => {
        console.log("Realtime change detected from another judge!", payload);
        if (payload.new && payload.new.state_data) {
          storeState = payload.new.state_data;
          saveStoreLocallyOnly();
          refreshAllViews();
        }
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime channel subscription error:", err);
  }
}

async function syncDataToCloud() {
  if (!supabaseClient || !isCloudOnline) return;

  try {
    const payload = {
      id: 'robofest_master_state',
      state_data: storeState,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('judging_portal_state')
      .upsert(payload);

    if (error) {
      console.warn("Cloud sync warning:", error.message);
    } else {
      console.log("State synced to Supabase Cloud for all judges!");
    }
  } catch (err) {
    console.warn("Network error during cloud sync:", err);
  }
}

async function pollStateFromCloud() {
  if (!supabaseClient || !isCloudOnline) return;

  try {
    const { data, error } = await supabaseClient
      .from('judging_portal_state')
      .select('state_data, updated_at')
      .eq('id', 'robofest_master_state')
      .single();

    if (data && data.state_data) {
      // Sync state across browsers if cloud has newer modifications
      const cloudStr = JSON.stringify(data.state_data);
      const localStr = JSON.stringify(storeState);
      if (cloudStr !== localStr) {
        console.log("Updated state received from multi-judge cloud sync!");
        storeState = data.state_data;
        saveStoreLocallyOnly();
        if (typeof refreshAllViews === 'function') {
          refreshAllViews();
        }
      }
    }
  } catch (err) {
    // Silent fail over to offline mode
  }
}

function saveStoreLocallyOnly() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
  } catch (e) {
    console.error(e);
  }
}

// Initializing Supabase on window load
window.addEventListener('load', () => {
  initSupabase();
});
