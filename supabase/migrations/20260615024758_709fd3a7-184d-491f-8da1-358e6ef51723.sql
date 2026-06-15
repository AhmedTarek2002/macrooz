
-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'mango',
  theme text NOT NULL DEFAULT 'light',
  current_weight numeric,
  target_weight numeric,
  diet_goal text NOT NULL DEFAULT 'maintain',
  calorie_target numeric NOT NULL DEFAULT 2000,
  protein_target numeric NOT NULL DEFAULT 120,
  carb_target numeric NOT NULL DEFAULT 220,
  fat_target numeric NOT NULL DEFAULT 65,
  fiber_target numeric NOT NULL DEFAULT 30,
  omega3_target numeric NOT NULL DEFAULT 1.6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FOODS (per 100g). micros jsonb maps nutrient_key -> numeric (per 100g)
CREATE TABLE public.foods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  icon text NOT NULL DEFAULT '🍽️',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric NOT NULL DEFAULT 0,
  omega3 numeric NOT NULL DEFAULT 0,
  micros jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage foods" ON public.foods FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_foods_updated BEFORE UPDATE ON public.foods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FOOD LOGS
CREATE TABLE public.food_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT current_date,
  meal text NOT NULL DEFAULT 'breakfast',
  grams numeric NOT NULL DEFAULT 100,
  position integer NOT NULL DEFAULT 0,
  -- snapshot of food at time of logging (so deletes/edits to food don't corrupt history)
  food_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_food_logs_profile_date ON public.food_logs(profile_id, log_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO anon, authenticated;
GRANT ALL ON public.food_logs TO service_role;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage food_logs" ON public.food_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- WEIGHT ENTRIES
CREATE TABLE public.weight_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT current_date,
  weight numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, entry_date)
);
CREATE INDEX idx_weight_profile_date ON public.weight_entries(profile_id, entry_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO anon, authenticated;
GRANT ALL ON public.weight_entries TO service_role;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage weight_entries" ON public.weight_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- NUTRIENT GOALS (vitamins / minerals RDA + UL)
CREATE TABLE public.nutrient_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nutrient_key text NOT NULL,
  rda numeric,
  upper_limit numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, nutrient_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrient_goals TO anon, authenticated;
GRANT ALL ON public.nutrient_goals TO service_role;
ALTER TABLE public.nutrient_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage nutrient_goals" ON public.nutrient_goals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_nutrient_goals_updated BEFORE UPDATE ON public.nutrient_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DAILY REVIEWS
CREATE TABLE public.daily_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT current_date,
  exercise_planned boolean NOT NULL DEFAULT false,
  exercise_completed boolean,
  exercise_adherence numeric,
  diet_adherence numeric,
  sleep_hours numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, review_date)
);
CREATE INDEX idx_reviews_profile_date ON public.daily_reviews(profile_id, review_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reviews TO anon, authenticated;
GRANT ALL ON public.daily_reviews TO service_role;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage daily_reviews" ON public.daily_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.daily_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
