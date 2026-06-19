import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  Save,
  Trash2,
  Database,
  ChevronDown,
  Check,
  Calculator as CalcIcon,
  Scale,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useProfile } from "@/context/ProfileProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  useNutrientGoals,
  useNutrientGoalMutations,
  useWeightEntries,
} from "@/hooks/useData";
import { VITAMINS, MINERALS, type NutrientDef } from "@/lib/nutrients";
import { goalsMap } from "@/lib/nutrition";
import {
  FORMULAS,
  ACTIVITY_LEVELS,
  computeMacros,
  type CalcInput,
  type FormulaKey,
} from "@/lib/calculator";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile & Goals — Macrooz" }] }),
  component: () => (
    <AppShell title="Profile & Goals" subtitle="Targets & nutrient limits">
      <ProfilePage />
    </AppShell>
  ),
});

function NumField({
  label,
  value,
  onChange,
  step = 1,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

type GoalState = Record<string, { rda: string; ul: string }>;

function ProfilePage() {
  const { currentProfile, refetchProfiles, setCurrentProfileId, profiles } = useProfile();
  const pid = currentProfile?.id ?? null;
  const { data: goals = [] } = useNutrientGoals(pid);
  const { upsert: upsertGoals } = useNutrientGoalMutations(pid);
  const { data: weightEntries = [] } = useWeightEntries(pid);

  // Last recorded weight comes from the Today tab weigh-ins (latest entry).
  const lastWeight =
    weightEntries.length > 0
      ? weightEntries[weightEntries.length - 1].weight
      : currentProfile?.current_weight ?? null;

  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [formula, setFormula] = useState<FormulaKey>("mifflin");
  const [bodyFat, setBodyFat] = useState("");
  const [proteinPerKg, setProteinPerKg] = useState("2");
  const [fatPct, setFatPct] = useState("25");
  const [calorieAdjust, setCalorieAdjust] = useState("500");
  const [goalState, setGoalState] = useState<GoalState>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Baseline snapshot — used to detect changes for the sticky Save All button.
  const [baseline, setBaseline] = useState("");

  // Seed all state from profile + goals, and capture the baseline.
  useEffect(() => {
    if (!currentProfile) return;
    const gm = goalsMap(goals);
    const nextGoals: GoalState = {};
    [...VITAMINS, ...MINERALS].forEach((d) => {
      const g = gm[d.key];
      nextGoals[d.key] = {
        rda: String(g?.rda ?? d.defaultRda ?? ""),
        ul: String(g?.upper_limit ?? d.defaultUl ?? ""),
      };
    });

    const seeded = {
      name: currentProfile.name ?? "",
      sex: currentProfile.sex ?? "male",
      age: currentProfile.age ? String(currentProfile.age) : "",
      height: currentProfile.height_cm ? String(currentProfile.height_cm) : "",
      activity: currentProfile.activity_level ?? 1.55,
      goal: currentProfile.diet_goal ?? "maintain",
      formula: currentProfile.calc_formula ?? "mifflin",
      bodyFat: currentProfile.body_fat_pct ? String(currentProfile.body_fat_pct) : "",
      proteinPerKg: String(currentProfile.protein_per_kg ?? 2),
      fatPct: String(currentProfile.fat_pct ?? 25),
      calorieAdjust: String(currentProfile.calorie_adjust ?? 500),
      goalState: nextGoals,
    };

    setName(seeded.name);
    setSex(seeded.sex);
    setAge(seeded.age);
    setHeight(seeded.height);
    setActivity(seeded.activity);
    setGoal(seeded.goal);
    setFormula(seeded.formula);
    setBodyFat(seeded.bodyFat);
    setProteinPerKg(seeded.proteinPerKg);
    setFatPct(seeded.fatPct);
    setCalorieAdjust(seeded.calorieAdjust);
    setGoalState(nextGoals);
    setBaseline(JSON.stringify(seeded));
  }, [currentProfile, goals]);

  const snapshot = JSON.stringify({
    name,
    sex,
    age,
    height,
    activity,
    goal,
    formula,
    bodyFat,
    proteinPerKg,
    fatPct,
    calorieAdjust,
    goalState,
  });
  const dirty = baseline !== "" && snapshot !== baseline;

  const input: CalcInput = useMemo(
    () => ({
      sex,
      age: Number(age) || 0,
      height_cm: Number(height) || 0,
      weight_kg: Number(lastWeight) || 0,
      body_fat_pct: bodyFat ? Number(bodyFat) : null,
      activity_level: activity,
      goal,
      protein_per_kg: Number(proteinPerKg) || 0,
      fat_pct: Number(fatPct) || 0,
      calorie_adjust: Number(calorieAdjust) || 0,
    }),
    [sex, age, height, lastWeight, bodyFat, activity, goal, proteinPerKg, fatPct, calorieAdjust],
  );

  const results = useMemo(
    () =>
      Object.fromEntries(FORMULAS.map((f) => [f.key, computeMacros(f.key, input)])) as Record<
        FormulaKey,
        ReturnType<typeof computeMacros>
      >,
    [input],
  );
  const selected = results[formula];
  const needsBodyFat = formula === "katch";

  // Sticky / floating Save All behaviour: floats above the nav while scrolling,
  // then settles inline once its placeholder scrolls into view.
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(false);
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setAtBottom(entry.isIntersecting), {
      rootMargin: "0px 0px -16px 0px",
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [dirty]);

  const save = async () => {
    if (!pid || !selected) {
      toast.error(
        needsBodyFat
          ? "Enter body fat % for Katch-McArdle"
          : "Fill in age and height first",
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        sex,
        age: age ? Number(age) : null,
        height_cm: height ? Number(height) : null,
        body_fat_pct: bodyFat ? Number(bodyFat) : null,
        activity_level: activity,
        diet_goal: goal,
        calc_formula: formula,
        protein_per_kg: Number(proteinPerKg) || 2,
        fat_pct: Number(fatPct) || 25,
        calorie_adjust: Number(calorieAdjust) || 0,
        calorie_target: selected.calories,
        protein_target: selected.protein,
        carb_target: selected.carbs,
        fat_target: selected.fat,
      } as never)
      .eq("id", pid);
    if (error) {
      setSaving(false);
      toast.error("Could not save");
      return;
    }
    await upsertGoals.mutateAsync(
      [...VITAMINS, ...MINERALS].map((d) => ({
        nutrient_key: d.key,
        rda: numOrNull(goalState[d.key]?.rda),
        upper_limit: numOrNull(goalState[d.key]?.ul),
      })),
    );
    setSaving(false);
    refetchProfiles();
    setBaseline(snapshot);
    toast.success("Saved ✓");
  };

  const deleteProfile = async () => {
    if (!pid) return;
    if (!confirm("Delete this profile and all its data? This cannot be undone.")) return;
    await supabase.from("profiles").delete().eq("id", pid);
    refetchProfiles();
    setCurrentProfileId(null);
    toast.success("Profile deleted");
  };

  if (!currentProfile) return null;

  const SaveButton = (
    <button
      onClick={save}
      disabled={saving}
      className="press flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground shadow-lg disabled:opacity-50"
    >
      <Save className="h-5 w-5" /> {saving ? "Saving…" : "Save All"}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Personal information (merged) */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Personal Information</h2>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mt-3">
          <span className="text-xs font-medium text-muted-foreground">Sex</span>
          <div className="mt-1 flex rounded-full bg-muted p-1">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`press flex-1 rounded-full py-2 text-sm font-semibold capitalize ${
                  sex === s ? "bg-card shadow-card" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumField label="Age" value={age} onChange={setAge} suffix="yr" placeholder="30" />
          <NumField label="Height" value={height} onChange={setHeight} suffix="cm" placeholder="175" />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Last recorded weight
              <Lock className="h-3 w-3" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold leading-none text-foreground">
                {lastWeight != null ? lastWeight : "—"}
              </span>
              {lastWeight != null && (
                <span className="text-sm font-semibold text-muted-foreground">kg</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xs font-medium text-muted-foreground">Activity level</span>
          <div className="mt-1 space-y-1.5">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.value}
                onClick={() => setActivity(a.value)}
                className={`press flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                  activity === a.value ? "border-primary bg-primary/5" : "bg-background"
                }`}
              >
                <span>
                  <span className="text-sm font-semibold">{a.label}</span>{" "}
                  <span className="text-[11px] text-muted-foreground">{a.desc}</span>
                </span>
                {activity === a.value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Diet goal */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Diet Goal</h2>
        <div className="flex rounded-full bg-muted p-1">
          {(["lose", "maintain", "gain"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`press flex-1 rounded-full py-2 text-sm font-semibold capitalize ${
                goal === g ? "bg-card shadow-card" : "text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Formula selection */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Formula</h2>
        <div className="space-y-2">
          {FORMULAS.map((f) => {
            const r = results[f.key];
            const active = formula === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFormula(f.key)}
                className={`press block w-full rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary/5" : "bg-background"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{f.name}</span>
                  {r ? (
                    <span className="text-sm font-bold text-primary">{r.calories} kcal</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {f.needsBodyFat ? "needs body fat %" : "—"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{f.blurb}</p>
              </button>
            );
          })}
        </div>

        {needsBodyFat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 rounded-xl border border-primary/40 bg-primary/5 p-3"
          >
            <NumField
              label="Body fat %"
              value={bodyFat}
              onChange={setBodyFat}
              step={0.1}
              suffix="%"
              placeholder="20"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Required for the Katch-McArdle formula.
            </p>
          </motion.div>
        )}
      </section>

      {/* Advanced settings (unchanged, same position before targets) */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="press flex w-full items-center justify-between rounded-2xl border bg-card p-4 shadow-card">
          <span className="font-bold">Advanced settings</span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 rounded-2xl border bg-card p-4 shadow-card">
            <NumField
              label="Protein per kg of body weight"
              value={proteinPerKg}
              onChange={setProteinPerKg}
              step={0.1}
              suffix="g/kg"
            />
            <NumField
              label="Fat (% of total calories)"
              value={fatPct}
              onChange={setFatPct}
              step={1}
              suffix="%"
            />
            {goal === "gain" && (
              <NumField
                label="Caloric Surplus"
                value={calorieAdjust}
                onChange={setCalorieAdjust}
                step={50}
                suffix="kcal"
                placeholder="500"
              />
            )}
            {goal === "lose" && (
              <NumField
                label="Caloric Deficit"
                value={calorieAdjust}
                onChange={setCalorieAdjust}
                step={50}
                suffix="kcal"
                placeholder="500"
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Protein defaults to 2 g/kg and fat to 25% of calories. Carbs fill the
              remaining calories automatically.
              {goal === "gain" && " Surplus is added on top of your TDEE."}
              {goal === "lose" && " Deficit is subtracted from your TDEE."}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Your daily targets (orange summary) */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <CalcIcon className="h-4 w-4 text-primary" /> Your daily targets
        </h2>
        {selected ? (
          <>
            <div className="mb-3 flex items-baseline justify-between rounded-xl gradient-hero px-4 py-3 text-primary-foreground">
              <span className="text-sm font-semibold opacity-90">Calories</span>
              <span className="text-2xl font-extrabold">{selected.calories}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Macro label="Protein" value={selected.protein} />
              <Macro label="Carbs" value={selected.carbs} />
              <Macro label="Fat" value={selected.fat} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              BMR {selected.bmr} · TDEE {selected.tdee} kcal/day
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {needsBodyFat
              ? "Enter your body fat % to see results."
              : "Fill in age and height (and log a weight) to see your targets."}
          </p>
        )}
      </section>

      {/* Micronutrient goals — collapsed accordions */}
      <GoalAccordion title="Vitamin Goals (RDA & Upper Limit)" defs={VITAMINS} state={goalState} setState={setGoalState} />
      <GoalAccordion title="Mineral Goals (RDA & Upper Limit)" defs={MINERALS} state={goalState} setState={setGoalState} />

      {profiles.length > 1 && (
        <button
          onClick={deleteProfile}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-status-over/40 py-3 font-semibold text-status-over"
        >
          <Trash2 className="h-4 w-4" /> Delete profile
        </button>
      )}

      {/* Manage foods */}
      <Link
        to="/foods"
        className="press flex w-full items-center justify-center gap-2 rounded-xl border bg-card py-3.5 font-bold shadow-card"
      >
        <Database className="h-5 w-5 text-primary" /> Manage Foods
      </Link>

      {/* Inline anchor for the Save All button — it settles here at the very bottom. */}
      <div ref={anchorRef}>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: atBottom ? 1 : 0, y: atBottom ? 0 : 8 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: atBottom ? "auto" : "none" }}
          >
            {SaveButton}
          </motion.div>
        )}
      </div>

      {/* Floating Save All — sticky above the nav while scrolling. */}
      <AnimatePresence>
        {dirty && !atBottom && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-40 mx-auto max-w-md px-4"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
          >
            {SaveButton}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background py-2.5">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground">{label} (g)</div>
    </div>
  );
}

function GoalAccordion({
  title,
  defs,
  state,
  setState,
}: {
  title: string;
  defs: NutrientDef[];
  state: GoalState;
  setState: Dispatch<SetStateAction<GoalState>>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="press flex w-full items-center justify-between rounded-2xl border bg-card p-4 shadow-card">
        <span className="font-bold">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-2xl border bg-card p-4 shadow-card">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 gap-y-1 text-xs">
            <span />
            <span className="w-20 text-center font-medium text-muted-foreground">RDA</span>
            <span className="w-20 text-center font-medium text-muted-foreground">Upper</span>
            {defs.map((d) => (
              <FragmentRow key={d.key} def={d} state={state} setState={setState} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FragmentRow({
  def,
  state,
  setState,
}: {
  def: NutrientDef;
  state: GoalState;
  setState: Dispatch<SetStateAction<GoalState>>;
}) {
  const v = state[def.key] || { rda: "", ul: "" };
  const upd = (field: "rda" | "ul", val: string) =>
    setState((s) => ({ ...s, [def.key]: { ...s[def.key], [field]: val } }));
  return (
    <>
      <span className="py-1 text-sm font-medium">
        {def.label} <span className="text-[10px] text-muted-foreground">({def.unit})</span>
      </span>
      <input
        type="number"
        value={v.rda}
        onChange={(e) => upd("rda", e.target.value)}
        className="w-20 rounded-lg border bg-background px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="number"
        value={v.ul}
        onChange={(e) => upd("ul", e.target.value)}
        className="w-20 rounded-lg border bg-background px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </>
  );
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
