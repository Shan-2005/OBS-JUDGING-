/* ==========================================================================
   ROBOFEST 2.0 - SUPABASE HYBRID CLOUD & OFFLINE SYNC LAYER
   ========================================================================== */

const SUPABASE_URL = "https://kcpgzjkhsirypbldukuc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fv6dmWZanAAxluu0w7A58Q_zgthZFGX";

let supabaseClient = null;
let isCloudOnline = false;

function initSupabase() {
  if (typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isCloudOnline = true;
      console.log("Supabase Client initialized successfully!");
      updateCloudSyncBadge(true);
    } catch (err) {
      console.warn("Supabase init failed, running in Offline LocalStorage mode.", err);
      updateCloudSyncBadge(false);
    }
  } else {
    console.warn("Supabase SDK CDN not loaded, running in Offline LocalStorage mode.");
    updateCloudSyncBadge(false);
  }
}

function updateCloudSyncBadge(online) {
  const badge = document.getElementById('cloud-sync-status-badge');
  if (badge) {
    if (online) {
      badge.className = "badge badge-success";
      badge.innerHTML = "☁️ Supabase Cloud Synced";
    } else {
      badge.className = "badge badge-warning";
      badge.innerHTML = "💾 LocalStorage Offline Mode";
    }
  }
}

async function syncDataToCloud(table, payload) {
  if (!supabaseClient || !isCloudOnline) return;

  try {
    const { data, error } = await supabaseClient
      .from(table)
      .upsert(payload);

    if (error) {
      console.warn(`Supabase upsert to ${table} failed:`, error.message);
    } else {
      console.log(`Cloud sync to ${table} successful!`);
    }
  } catch (err) {
    console.warn("Network error during cloud sync:", err);
  }
}

// Initializing Supabase on window load
window.addEventListener('load', () => {
  initSupabase();
});
