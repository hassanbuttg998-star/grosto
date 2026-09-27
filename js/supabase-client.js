/* =========================================================
   GROSTO — Shared Supabase Client
   Har HTML page isko <script> tag se load karti hai
   (Supabase library ke script tag ke BAAD load hona chahiye)
   ========================================================= */

const SUPABASE_URL = "https://bmumxeroxckgcfvbmfld.supabase.co";
const SUPABASE_KEY = "sb_publishable_LBoEA_QWDPOE1gvPIAeqfQ_oVeAghBq";

const grostoDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ================= SETTINGS HELPER =================
   Saari settings (WhatsApp number, EasyPaisa/JazzCash details,
   discount banner, store address) ek dafa fetch karke
   object ki tarah return karta hai:
   { whatsapp_number: "...", easypaisa_title: "...", ... }
*/
async function getGrostoSettings() {
  const { data, error } = await grostoDB.from("settings").select("key, value");

  const settings = {};

  if (error) {
    console.error("Settings load error:", error);
    return settings;
  }

  data.forEach((row) => {
    settings[row.key] = row.value;
  });

  return settings;
}
