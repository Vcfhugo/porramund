/* ============================================================
   Supabase Client — COPY TO supabase-client.js AND ADD CREDENTIALS
   ============================================================ */

// Obtén tu URL y ANON KEY en: supabase.com → Settings → API
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;
window.SB = null; // Inicializa sin SB hasta que haya usuario autenticado
window.SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL');
