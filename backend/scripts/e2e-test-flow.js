'use strict';

/**
 * Test end-to-end del flujo Prode contra Supabase real.
 * Carga credenciales desde backend/.env o mobile/.env automáticamente.
 * Usa service_role si está disponible; si no, anon key (suficiente para este test).
 *
 * Flujo:
 * 1. Crear partido de prueba
 * 2. Simular predicciones de usuarios reales
 * 3. Verificar bloqueo (simular tiempo moviendo match_date)
 * 4. Cargar resultado
 * 5. Verificar puntos y ranking
 */

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
    throw new Error(
      'Faltan credenciales Supabase. Configurá backend/.env o mobile/.env con SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const supabase = createSupabaseClient();
  const log = (step, detail) => console.log(`[e2e] ${step}: ${detail}`);

  // 1. Seed test match
  const { data: fixtureId, error: seedErr } = await supabase.rpc('seed_test_match');
  if (seedErr) throw seedErr;
  log('1/7', `Partido creado fixture_id=${fixtureId}`);

  const { data: matchBefore } = await supabase
    .from('matches')
    .select('fixture_id,home_team,away_team,match_date,home_goals,away_goals')
    .eq('fixture_id', fixtureId)
    .single();
  assert(matchBefore?.home_team === 'Argentina', 'equipo local incorrecto');
  assert(matchBefore?.away_team === 'Brasil', 'equipo visitante incorrecto');
  log('1/7', `Kickoff ${matchBefore.match_date}`);

  // 2. Seed predictions for real users
  const { data: seedPreds, error: predErr } = await supabase.rpc('seed_test_predictions', {
    p_fixture_id: fixtureId,
  });
  if (predErr) throw predErr;
  const count = seedPreds?.count ?? 0;
  assert(count > 0, 'no se crearon predicciones — necesitás usuarios habilitados en clientes');
  log('2/7', `${count} predicciones de usuarios reales`);

  // 3. Predicción abierta antes del lock
  const { data: lockedBefore } = await supabase.rpc('is_prediction_locked_for_fixture', {
    p_fixture_id: fixtureId,
  });
  assert(lockedBefore === false, 'no debería estar bloqueado aún');
  log('3/7', 'Bloqueo: abierto (OK)');

  // 4. Simular paso del tiempo: mover kickoff al pasado
  const pastKickoff = new Date(Date.now() - 60 * 1000).toISOString();
  const { error: timeErr } = await supabase
    .from('matches')
    .update({ match_date: pastKickoff })
    .eq('fixture_id', fixtureId);
  if (timeErr) throw timeErr;

  const { data: lockedAfter } = await supabase.rpc('is_prediction_locked_for_fixture', {
    p_fixture_id: fixtureId,
  });
  assert(lockedAfter === true, 'debería estar bloqueado después de simular tiempo');
  log('4/7', 'Bloqueo: cerrado (OK)');

  const { error: blockErr } = await supabase.rpc('upsert_prediction_secure', {
    p_user_id: 'test',
    p_cliente_id: '999999',
    p_fixture_id: fixtureId,
    p_pick_winner: 'home',
    p_score_home: 1,
    p_score_away: 0,
  });
  assert(blockErr?.message?.includes('PREDICTION_LOCKED'), 'upsert debería fallar con PREDICTION_LOCKED');
  log('4/7', 'Backend rechaza predicción bloqueada (OK)');

  // 5. Cargar resultado 2-1
  const { error: resultErr } = await supabase
    .from('matches')
    .update({ home_goals: 2, away_goals: 1, status: 'FT' })
    .eq('fixture_id', fixtureId);
  if (resultErr) throw resultErr;
  log('5/7', 'Resultado cargado 2-1');

  // 6. Verificar puntos
  const { data: preds } = await supabase
    .from('predictions')
    .select('cliente_id,score_home,score_away,points_earned,status')
    .eq('fixture_id', fixtureId);
  assert((preds ?? []).length > 0, 'sin predicciones tras resultado');
  const exactHit = (preds ?? []).find((p) => p.score_home === 2 && p.score_away === 1);
  if (exactHit) {
    assert(exactHit.points_earned === 3, 'resultado exacto debe dar 3 puntos');
    assert(exactHit.status === 'correct', 'status correct para exacto');
  }
  log('6/7', `Puntos calculados — exacto: ${exactHit ? '3pts OK' : 'sin exacto en sample'}`);

  // 7. Ranking
  const { data: ranking } = await supabase
    .from('ranking')
    .select('cliente_id,nombre,total_points,position')
    .order('total_points', { ascending: false })
    .limit(5);
  assert((ranking ?? []).length > 0, 'ranking vacío');
  assert(
    (ranking ?? []).every((r) => Number.isFinite(r.total_points) && r.total_points >= 0),
    'ranking con NaN o valores inválidos',
  );
  log('7/7', `Ranking top: ${ranking[0].nombre} (${ranking[0].total_points} pts, pos ${ranking[0].position})`);

  console.log('\n✅ E2E completado sin errores');
}

main().catch((err) => {
  console.error('\n❌ E2E falló:', err.message ?? err);
  process.exit(1);
});
