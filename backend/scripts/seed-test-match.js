'use strict';

const { createClient } = require('@supabase/supabase-js');
const { loadEnv } = require('./loadEnv');

loadEnv();

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Faltan credenciales Supabase en backend/.env o mobile/.env');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('seed_test_match');
  if (error) throw error;
  const kickoff = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  console.log(`Partido de prueba #${data} — Argentina vs Brasil — inicio ${kickoff}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
