import { supabase } from '../../../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'CREATE_PREDICTION'
  | 'UPDATE_PREDICTION'
  | 'DELETE_PREDICTION'
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
 * Schema real: id, cliente_id, action, metadata (jsonb), created_at
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      cliente_id: input.cliente_id ?? input.user_id ?? null,
      action:     input.action,
      metadata:   input.detail ? { detail: input.detail, user_id: input.user_id } : { user_id: input.user_id },
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[activityLogs] Error al registrar actividad:', error.message);
    }
  } catch (e) {
    console.warn('[activityLogs] Excepción inesperada:', e);
  }
}
