import { supabase } from '../../../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'CREATE_PREDICTION'
  | 'UPDATE_PREDICTION'
  | 'CREATE_NEWS'
  | 'UPDATE_NEWS'
  | 'DELETE_NEWS';

export type LogActivityInput = {
  user_id: string;
  cliente_id?: string;
  action: ActivityAction;
  detail?: string;
};

// ── Función helper (fire-and-forget seguro) ───────────────────

/**
 * Registra una acción en la tabla activity_logs.
 * No lanza excepciones — si falla, loguea en consola y continúa.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: input.user_id,
      cliente_id: input.cliente_id ?? null,
      action: input.action,
      detail: input.detail ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[activityLogs] Error al registrar actividad:', error.message);
    }
  } catch (e) {
    console.warn('[activityLogs] Excepción inesperada:', e);
  }
}
