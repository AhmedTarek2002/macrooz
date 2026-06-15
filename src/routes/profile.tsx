import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/context/ProfileProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNutrientGoals, useNutrientGoalMutations } from "@/hooks/useData";
import { VITAMINS, MINERALS, type NutrientDef } from "@/lib/nutrients";
import { goalsMap } from "@/lib/nutrition";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile & Goals — Macrooz" }] }),
  component: () => (
    <AppShell title="Profile & Goals" subtitle="Targets & nutrient limits">
      <ProfilePage />
    </AppShell>
  ),
});

function Field({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function ProfilePage() {
  const { currentProfile, refetchProfiles, setCurrentProfileId, profiles } = useProfile();
  const pid = currentProfile?.id ?? null;
  const { data: goals = [] } = useNutrientGoals(pid);
  const { upsert: upsertGoals } = useNutrientGoalMutations(pid);

  const [form, setForm] = useState(() => mapProfile(currentProfile));
  const [goalState, setGoalState] = useState<Record<string, { rda: string; ul: string }>>({});

  useEffect(() => setForm(mapProfile(currentProfile)), [currentProfile]);
  useEffect(() => {
    const gm = goalsMap(goals);
    const next: Record<string, { rda: string; ul: string }> = {};
    [...VITAMINS, ...MINERALS].forEach((d) => {
      const g = gm[d.key];
      next[d.key] = {
        rda: String(g?.rda ?? d.defaultRda ?? ""),
        ul: String(g?.upper_limit ?? d.defaultUl ?? ""),
      };
    });
    setGoalState(next);
  }, [goals]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!pid) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        current_weight: numOrNull(form.current_weight),
        target_weight: numOrNull(form.target_weight),
        diet_goal: form.diet_goal,
        calorie_target: Number(form.calorie_target) || 0,
        protein_target: Number(form.protein_target) || 0,
        carb_target: Number(form.carb_target) || 0,
        fat_target: Number(form.fat_target) || 0,
        fiber_target: Number(form.fiber_target) || 0,
        omega3_target: Number(form.omega3_target) || 0,
      } as never)
      .eq("id", pid);
    if (error) {
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
    refetchProfiles();
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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Profile</h2>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Current weight" value={form.current_weight} onChange={(v) => set("current_weight", v)} step={0.1} suffix="kg" />
          <Field label="Target weight" value={form.target_weight} onChange={(v) => set("target_weight", v)} step={0.1} suffix="kg" />
        </div>
        <div className="mt-3">
          <span className="text-xs font-medium text-muted-foreground">Diet goal</span>
          <div className="mt-1 flex rounded-full bg-muted p-1">
            {(["lose", "maintain", "gain"] as const).map((g) => (
              <button
                key={g}
                onClick={() => set("diet_goal", g)}
                className={`press flex-1 rounded-full py-2 text-sm font-semibold capitalize ${
                  form.diet_goal === g ? "bg-card shadow-card" : "text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Daily macro targets</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories" value={form.calorie_target} onChange={(v) => set("calorie_target", v)} suffix="kcal" />
          <Field label="Protein" value={form.protein_target} onChange={(v) => set("protein_target", v)} suffix="g" />
          <Field label="Carbs" value={form.carb_target} onChange={(v) => set("carb_target", v)} suffix="g" />
          <Field label="Fat" value={form.fat_target} onChange={(v) => set("fat_target", v)} suffix="g" />
          <Field label="Fiber" value={form.fiber_target} onChange={(v) => set("fiber_target", v)} suffix="g" />
          <Field label="Omega-3" value={form.omega3_target} onChange={(v) => set("omega3_target", v)} step={0.1} suffix="g" />
        </div>
      </section>

      <GoalSection title="Vitamin goals (RDA & Upper Limit)" defs={VITAMINS} state={goalState} setState={setGoalState} />
      <GoalSection title="Mineral goals (RDA & Upper Limit)" defs={MINERALS} state={goalState} setState={setGoalState} />

      <button
        onClick={save}
        className="press flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground"
      >
        <Save className="h-5 w-5" /> Save all
      </button>

      {profiles.length > 1 && (
        <button
          onClick={deleteProfile}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-status-over/40 py-3 font-semibold text-status-over"
        >
          <Trash2 className="h-4 w-4" /> Delete profile
        </button>
      )}
    </div>
  );
}

function GoalSection({
  title,
  defs,
  state,
  setState,
}: {
  title: string;
  defs: NutrientDef[];
  state: Record<string, { rda: string; ul: string }>;
  setState: React.Dispatch<React.SetStateAction<Record<string, { rda: string; ul: string }>>>;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-2 font-bold">{title}</h2>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 gap-y-1 text-xs">
        <span />
        <span className="w-20 text-center font-medium text-muted-foreground">RDA</span>
        <span className="w-20 text-center font-medium text-muted-foreground">Upper</span>
        {defs.map((d) => (
          <FragmentRow key={d.key} def={d} state={state} setState={setState} />
        ))}
      </div>
    </section>
  );
}

function FragmentRow({
  def,
  state,
  setState,
}: {
  def: NutrientDef;
  state: Record<string, { rda: string; ul: string }>;
  setState: React.Dispatch<React.SetStateAction<Record<string, { rda: string; ul: string }>>>;
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

function mapProfile(p: ReturnType<typeof useProfile>["currentProfile"]) {
  return {
    name: p?.name ?? "",
    current_weight: p?.current_weight ?? "",
    target_weight: p?.target_weight ?? "",
    diet_goal: (p?.diet_goal ?? "maintain") as "lose" | "gain" | "maintain",
    calorie_target: p?.calorie_target ?? 2000,
    protein_target: p?.protein_target ?? 120,
    carb_target: p?.carb_target ?? 220,
    fat_target: p?.fat_target ?? 65,
    fiber_target: p?.fiber_target ?? 30,
    omega3_target: p?.omega3_target ?? 1.6,
  };
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
