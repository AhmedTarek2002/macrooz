ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sex text NOT NULL DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS body_fat_pct numeric,
  ADD COLUMN IF NOT EXISTS activity_level numeric NOT NULL DEFAULT 1.55,
  ADD COLUMN IF NOT EXISTS protein_per_kg numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS fat_pct numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS calc_formula text NOT NULL DEFAULT 'mifflin';