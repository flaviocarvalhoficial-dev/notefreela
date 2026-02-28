-- ADICIONA NOVAS COLUNAS PARA PECULIARIDADES DE HÁBITOS
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comentário para documentar o que vai no metadata:
-- {
--   "time": "08:00",
--   "shift": "manhã",
--   "distance": "5km",
--   "is_running": true
-- }
