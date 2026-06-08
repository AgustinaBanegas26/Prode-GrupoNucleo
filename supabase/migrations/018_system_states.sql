-- 18) Gestión de Estado del Sistema

-- Drop the triggers from 017 to fulfill "NO implementar un nuevo sistema de notificaciones para usuarios"
DROP TRIGGER IF EXISTS trg_news_insert_notification ON public.news;
DROP TRIGGER IF EXISTS trg_matches_insert_notification ON public.matches;
DROP TRIGGER IF EXISTS trg_matches_new_notification ON public.matches;
DROP FUNCTION IF EXISTS public.trg_news_insert_notification();
DROP FUNCTION IF EXISTS public.trg_matches_insert_notification();
DROP FUNCTION IF EXISTS public.trg_matches_new_notification();
DROP TABLE IF EXISTS public.notification_reads CASCADE;

-- Create table to track system states
CREATE TABLE IF NOT EXISTS public.system_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with initial states
INSERT INTO public.system_states (name, key, is_active, description) VALUES
  ('Sistema activo', 'sistema_activo', true, 'Indica si el sistema principal está disponible para los usuarios.'),
  ('Mantenimiento', 'mantenimiento', false, 'Pone el sistema en modo de mantenimiento y bloquea el acceso.'),
  ('Inscripciones abiertas', 'inscripciones_abiertas', true, 'Permite el registro de nuevos usuarios en la plataforma.'),
  ('Inscripciones cerradas', 'inscripciones_cerradas', false, 'Deshabilita el registro de nuevos usuarios.'),
  ('Predicciones habilitadas', 'predicciones_habilitadas', true, 'Permite a los usuarios guardar o modificar sus pronósticos.'),
  ('Predicciones bloqueadas', 'predicciones_bloqueadas', false, 'Bloquea el guardado y modificación de pronósticos a nivel global.')
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Enable RLS and set policies
ALTER TABLE public.system_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_states_select" ON public.system_states;
CREATE POLICY "system_states_select" ON public.system_states FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "system_states_all" ON public.system_states;
CREATE POLICY "system_states_all" ON public.system_states FOR ALL TO public USING (true) WITH CHECK (true);

-- Register in Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'system_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_states;
  END IF;
END $$;
