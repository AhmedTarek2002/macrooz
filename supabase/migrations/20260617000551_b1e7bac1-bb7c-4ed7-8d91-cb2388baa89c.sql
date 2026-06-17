ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calorie_adjust numeric NOT NULL DEFAULT 500;