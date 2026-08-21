/* ==========================================================================
   ROBOFEST 2.0 - SUPABASE CLOUD DATABASE SYNC & NETWORK GUARDIAN
   ========================================================================== */

const SUPABASE_URL = "https://kcpgzjkhsirypbldukuc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fv6dmWZanAAxluu0w7A58Q_zgthZFGX";

let supabaseClient = null;
let isCloudOnline = navigator.onLine;
let realTimeChannel = null;
let hasPendingOfflineChanges = false;
let pendingOfflineEditsCount = 0;
let lastSyncedLocalState = "";
let lastLocalSaveTimestamp = 0;
let syncDebounceTimer = null;

function initSupabase() {
  setupNetworkListeners();

  if (typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isCloudOnline = true;
      console.log("✅ Supabase Online Client connected successfully!");
      updateNetworkStatus(true);
      setupRealtimeSubscriptions();
      fetchInitialState();
    } catch (err) {
      console.warn("Supabase connection warning:", err);
      updateNetworkStatus(false);
    }
  } else {
    updateNetworkStatus(false);
  }
}

function setupNetworkListeners() {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log("🌐 Internet connection restored!");
      updateNetworkStatus(true);
    });

    window.addEventListener('offline', () => {
      console.warn("⚠️ Internet connection lost!");
      updateNetworkStatus(false);
    });
  }
}

function updateNetworkStatus(isOnline) {
  isCloudOnline = isOnline && navigator.onLine;
  const banner = document.getElementById('network-offline-banner');
  const bannerText = document.getElementById('offline-banner-text');
  const pendingBadge = document.getElementById('offline-pending-badge');
  const syncBadge = document.getElementById('cloud-sync-status-badge');

  if (isCloudOnline) {
    if (hasPendingOfflineChanges) {
      if (banner) {
        banner.style.background = "linear-gradient(90deg, #059669, #10b981)";
        if (bannerText) bannerText.innerHTML = "✅ NETWORK RESTORED — Auto-syncing queued offline updates to cloud...";
        if (pendingBadge) pendingBadge.style.display = "none";
        banner.style.display = "block";
        banner.classList.remove('hidden');
      }

      // Flush queue to cloud immediately
      syncDataToCloud().then(() => {
        hasPendingOfflineChanges = false;
        pendingOfflineEditsCount = 0;
        if (bannerText) bannerText.innerHTML = "✅ ALL OFFLINE EDITS SYNCED TO CLOUD SUCCESSFULLY!";
        setTimeout(() => {
          if (banner) {
            banner.style.display = "none";
            banner.classList.add('hidden');
          }
        }, 3500);
      });
    } else {
      if (banner) {
        banner.style.display = "none";
        banner.classList.add('hidden');
      }
    }

    if (syncBadge) {
      syncBadge.className = "badge badge-success";
      syncBadge.innerHTML = `<i class="fa-solid fa-cloud"></i> Online (Supabase Live)`;
    }
  } else {
    // Network Offline
    if (banner) {
      banner.style.background = "linear-gradient(90deg, #dc2626, #b91c1c)";
      if (bannerText) bannerText.innerHTML = "⚠️ NETWORK CONNECTION LOST — You are working offline. Edits will auto-sync to cloud when internet is back!";
      if (pendingBadge) {
        pendingBadge.style.display = "inline-block";
        pendingBadge.textContent = `${pendingOfflineEditsCount} Pending Sync`;
      }
      banner.style.display = "block";
      banner.classList.remove('hidden');
    }

    if (syncBadge) {
      syncBadge.className = "badge badge-danger";
      syncBadge.innerHTML = `<i class="fa-solid fa-wifi"></i> Offline (${pendingOfflineEditsCount} Queued)`;
    }
  }
}

function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  try {
    realTimeChannel = supabaseClient.channel('public:obs_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judging_portal_state' }, payload => {
        if (Date.now() - lastLocalSaveTimestamp < 2500) {
          return;
        }

        if (payload.new && payload.new.state_data && Array.isArray(payload.new.state_data.teams) && payload.new.state_data.teams.length >= 58) {
          const cloudStr = JSON.stringify(payload.new.state_data);
          const localStr = JSON.stringify(storeState);

          if (cloudStr !== localStr && cloudStr !== lastSyncedLocalState) {
            storeState = typeof mergeMasterStates === 'function' ? mergeMasterStates(storeState, payload.new.state_data) : payload.new.state_data;
            lastSyncedLocalState = JSON.stringify(storeState);
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
  if (!supabaseClient || !navigator.onLine) return;
  try {
    const { data, error } = await supabaseClient
      .from('judging_portal_state')
      .select('state_data')
      .eq('id', 'robofest_master_state')
      .single();

    if (data && data.state_data && Array.isArray(data.state_data.teams) && data.state_data.teams.length >= 58) {
      const cloudStr = JSON.stringify(data.state_data);
      const localStr = JSON.stringify(storeState);
      if (cloudStr !== localStr) {
        storeState = typeof mergeMasterStates === 'function' ? mergeMasterStates(storeState, data.state_data) : data.state_data;
        lastSyncedLocalState = JSON.stringify(storeState);
        saveStoreLocallyOnly();
        if (typeof refreshAllViews === 'function') refreshAllViews();
        console.log("✅ Non-destructive merged online master state from Supabase!");
      }
    } else {
      console.log("Cloud master state empty or initializing, uploading local master state...");
      syncDataToCloud();
    }
  } catch (err) {
    console.warn("Failed to fetch initial state from Supabase:", err);
    updateNetworkStatus(false);
  }
}

function syncDataToCloud() {
  return new Promise((resolve) => {
    lastLocalSaveTimestamp = Date.now();
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

    syncDebounceTimer = setTimeout(async () => {
      if (!supabaseClient || !navigator.onLine) {
        hasPendingOfflineChanges = true;
        pendingOfflineEditsCount++;
        updateNetworkStatus(false);
        resolve(false);
        return;
      }

      try {
        lastSyncedLocalState = JSON.stringify(storeState);

        // 1. Sync full master state
        const masterPayload = {
          id: 'robofest_master_state',
          state_data: storeState,
          updated_at: new Date().toISOString()
        };

        const { error: masterErr } = await supabaseClient
          .from('judging_portal_state')
          .upsert(masterPayload);

        if (masterErr) throw masterErr;

        // 2. Push participants & teams details to Supabase teams table
        await pushParticipantsToSupabase();

        hasPendingOfflineChanges = false;
        pendingOfflineEditsCount = 0;
        updateNetworkStatus(true);
        resolve(true);
      } catch (err) {
        console.warn("Cloud sync network error:", err);
        hasPendingOfflineChanges = true;
        pendingOfflineEditsCount++;
        updateNetworkStatus(false);
        resolve(false);
      }
    }, 300);
  });
}

async function pushParticipantsToSupabase() {
  if (!supabaseClient || !navigator.onLine) return;

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
    }
  } catch (err) {
    console.warn("Push participants error:", err);
  }
}

async function pollStateFromCloud() {
  if (!supabaseClient || !navigator.onLine) return;

  try {
    const { data } = await supabaseClient
      .from('judging_portal_state')
      .select('state_data')
      .eq('id', 'robofest_master_state')
      .single();

    if (data && data.state_data && Array.isArray(data.state_data.teams) && data.state_data.teams.length >= 58) {
      const cloudStr = JSON.stringify(data.state_data);
      const localStr = JSON.stringify(storeState);
      if (cloudStr !== localStr) {
        storeState = data.state_data;
        saveStoreLocallyOnly();
        if (typeof refreshAllViews === 'function') refreshAllViews();
      }
    }
  } catch (err) {
    // Failover
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
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initSupabase();
  });
}

