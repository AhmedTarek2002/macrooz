CREATE TABLE IF NOT EXISTS public.meal_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_templates_profile ON public.meal_templates(profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_templates TO anon, authenticated;
GRANT ALL ON public.meal_templates TO service_role;
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage meal_templates" ON public.meal_templates;
CREATE POLICY "Public manage meal_templates" ON public.meal_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_meal_templates_updated ON public.meal_templates;
CREATE TRIGGER trg_meal_templates_updated BEFORE UPDATE ON public.meal_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();