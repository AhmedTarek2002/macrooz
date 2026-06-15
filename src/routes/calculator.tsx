import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ChevronDown, Calculator as CalcIcon, Sparkles, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/context/ProfileProvider";
import { useWeightMutations } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import {
  FORMULAS,
  ACTIVITY_LEVELS,
  computeMacros,
  type CalcInput,
  type FormulaKey,
} from "@/lib/calculator";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Macro Calculator — Macrooz" },
      {
        name: "description",
        content:
          "Calculate your daily calories, protein, carbs and fat using Mifflin-St Jeor, Harris-Benedict or Katch-McArdle.",
      },
    ],
  }),
  component: () => (
    <AppShell title="Calculator" subtitle="Daily calories & macros">
      <CalculatorPage />
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

function CalculatorPage() {
  const { currentProfile, refetchProfiles } = useProfile();
  const navigate = useNavigate();
  const pid = currentProfile?.id ?? null;
  const { upsert: upsertWeight } = useWeightMutations(pid);


  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [formula, setFormula] = useState<FormulaKey>("mifflin");
  const [proteinPerKg, setProteinPerKg] = useState("2");
  const [fatPct, setFatPct] = useState("25");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed from profile.
  useEffect(() => {
    if (!currentProfile) return;
    setSex(currentProfile.sex ?? "male");
    setAge(currentProfile.age ? String(currentProfile.age) : "");
    setHeight(currentProfile.height_cm ? String(currentProfile.height_cm) : "");
    setWeight(currentProfile.current_weight ? String(currentProfile.current_weight) : "");
    setBodyFat(currentProfile.body_fat_pct ? String(currentProfile.body_fat_pct) : "");
    setActivity(currentProfile.activity_level ?? 1.55);
    setGoal(currentProfile.diet_goal ?? "maintain");
    setFormula(currentProfile.calc_formula ?? "mifflin");
    setProteinPerKg(String(currentProfile.protein_per_kg ?? 2));
    setFatPct(String(currentProfile.fat_pct ?? 25));
  }, [currentProfile]);

  const input: CalcInput = useMemo(
    () => ({
      sex,
      age: Number(age) || 0,
      height_cm: Number(height) || 0,
      weight_kg: Number(weight) || 0,
      body_fat_pct: bodyFat ? Number(bodyFat) : null,
      activity_level: activity,
      goal,
      protein_per_kg: Number(proteinPerKg) || 0,
      fat_pct: Number(fatPct) || 0,
    }),
    [sex, age, height, weight, bodyFat, activity, goal, proteinPerKg, fatPct],
  );

  const results = useMemo(
    () =>
      Object.fromEntries(
        FORMULAS.map((f) => [f.key, computeMacros(f.key, input)]),
      ) as Record<FormulaKey, ReturnType<typeof computeMacros>>,
    [input],
  );

  const selected = results[formula];
  const needsBodyFat = formula === "katch";

  const apply = async () => {
    if (!pid) return;
    if (!selected) {
      toast.error(
        needsBodyFat
          ? "Enter body fat % for Katch-McArdle"
          : "Fill in age, height and weight first",
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        sex,
        age: age ? Number(age) : null,
        height_cm: height ? Number(height) : null,
        current_weight: weight ? Number(weight) : null,
        body_fat_pct: bodyFat ? Number(bodyFat) : null,
        activity_level: activity,
        diet_goal: goal,
        calc_formula: formula,
        protein_per_kg: Number(proteinPerKg) || 2,
        fat_pct: Number(fatPct) || 25,
        calorie_target: selected.calories,
        protein_target: selected.protein,
        carb_target: selected.carbs,
        fat_target: selected.fat,
      } as never)
      .eq("id", pid);
    setSaving(false);
    if (error) {
      toast.error("Could not save targets");
      return;
    }
    refetchProfiles();
    toast.success("Targets applied ✓ Now build your day");
    navigate({ to: "/" });
  };

  if (!currentProfile) return null;

  return (
    <div className="space-y-4 pb-4">
      {/* Personal info */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">About you</h2>

        <div className="mb-3">
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

        <div className="grid grid-cols-3 gap-3">
          <NumField label="Age" value={age} onChange={setAge} suffix="yr" placeholder="30" />
          <NumField label="Height" value={height} onChange={setHeight} suffix="cm" placeholder="175" />
          <NumField label="Weight" value={weight} onChange={setWeight} step={0.1} suffix="kg" placeholder="75" />
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

        <div className="mt-3">
          <span className="text-xs font-medium text-muted-foreground">Goal</span>
          <div className="mt-1 flex rounded-full bg-muted p-1">
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

      {/* Advanced settings */}
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
            <p className="text-[11px] text-muted-foreground">
              Protein defaults to 2 g/kg and fat to 25% of calories. Carbs fill the
              remaining calories automatically.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Result */}
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
              : "Fill in age, height and weight to see your targets."}
          </p>
        )}
      </section>

      <button
        onClick={apply}
        disabled={!selected || saving}
        className="press flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground disabled:opacity-50"
      >
        <Sparkles className="h-5 w-5" />
        {saving ? "Applying…" : "Apply targets & build my day"}
      </button>
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
