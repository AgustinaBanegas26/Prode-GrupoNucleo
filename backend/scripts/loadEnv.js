'use strict';

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const backendDir = path.join(__dirname, '..');
  const repoRoot = path.join(backendDir, '..');

  parseEnvFile(path.join(backendDir, '.env'));
  parseEnvFile(path.join(repoRoot, 'mobile', '.env'));

  if (!process.env.SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  }

  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY
    && !process.env.SUPABASE_SERVICE_KEY
    && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ) {
    process.env.SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }
}

module.exports = { loadEnv };
