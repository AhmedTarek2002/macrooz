import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Download, Flame, Scale, Pencil, Check, ChevronDown, Moon, Salad, Dumbbell, Save, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { computeMacros, type CalcInput } from "@/lib/calculator";
import { AppShell } from "@/components/AppShell";
import { DateNav } from "@/components/DateNav";
import { MealSection } from "@/components/MealSection";
import { FoodPicker } from "@/components/FoodPicker";
import { MicrosList } from "@/components/MicrosList";
import { ProgressRing } from "@/components/ProgressRing";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useProfile } from "@/context/ProfileProvider";
import { useFoodLogs, useFoodLogMutations, useNutrientGoals, useWeightEntries, useWeightMutations, useDailyReview, useReviewMutations } from "@/hooks/useData";
import { MEALS, type Meal } from "@/lib/nutrients";
import { sumLogs, foodToSnapshot, goalsMap, todayStr, fmt, round } from "@/lib/nutrition";
import type { DailyReview, Food, FoodLog } from "@/lib/types";

// Magnetic snap: keep every value 0-100 selectable, but pull values that land
// right next to a multiple of 10 onto that multiple for an easier "magnet" stop.
function magnetTo10(v: number) {
  const nearest = Math.round(v / 10) * 10;
  return Math.abs(v - nearest) <= 1 ? nearest : v;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Macrooz — Daily Nutrition & Macro Tracker" },
      { name: "description", content: "Plan meals and track macros, micros, weight and fitness with Macrooz." },
    ],
  }),
  component: () => (
    <AppShell title="Today" subtitle="Plan your meals">
      <TodayPage />
    </AppShell>
  ),
});

function TodayPage() {
  const { currentProfile } = useProfile();
  const pid = currentProfile?.id ?? null;
  const [date, setDate] = useState(todayStr());
  const [tab, setTab] = useState<"meals" | "micros">("meals");
  const [pickerMeal, setPickerMeal] = useState<Meal | null>(null);
  const [editLog, setEditLog] = useState<FoodLog | null>(null);
  const mealsRef = useRef<HTMLDivElement>(null);

  const { data: logs = [] } = useFoodLogs(pid, date);
  const { data: goals = [] } = useNutrientGoals(pid);
  const { add, update, remove } = useFoodLogMutations(pid, date);
  const { data: weights = [] } = useWeightEntries(pid);
  const { upsert: upsertWeight } = useWeightMutations(pid);
  const { data: review } = useDailyReview(pid, date);
  const { upsert: upsertReview } = useReviewMutations(pid, date);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const byMeal = useMemo(() => {
    const m: Record<string, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    for (const l of logs) (m[l.meal] ||= []).push(l);
    return m;
  }, [logs]);

  const totals = useMemo(() => sumLogs(logs), [logs]);
  const gMap = useMemo(() => goalsMap(goals), [goals]);
  const p = currentProfile!;

  const handleAdd = (food: Food, grams: number, meal: Meal) => {
    const pos = (byMeal[meal]?.length ?? 0);
    add.mutate({
      profile_id: pid!,
      food_id: food.id,
      log_date: date,
      meal,
      grams,
      position: pos,
      food_snapshot: foodToSnapshot(food),
    });
    toast.success(`Added ${food.name}`);
  };

  const handleDuplicate = (log: FoodLog) => {
    add.mutate({
      profile_id: pid!,
      food_id: log.food_id,
      log_date: date,
      meal: log.meal,
      grams: log.grams,
      position: (byMeal[log.meal]?.length ?? 0),
      food_snapshot: log.food_snapshot,
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const targetMeal = (over.data.current?.meal ?? String(over.id).replace("meal-", "")) as string;
    const log = logs.find((l) => l.id === active.id);
    if (log && targetMeal && log.meal !== targetMeal) {
      update.mutate({ id: log.id, meal: targetMeal });
      toast.success(`Moved to ${targetMeal}`);
    }
  };

  const exportImage = async () => {
    if (!mealsRef.current) return;
    try {
      const dataUrl = await toPng(mealsRef.current, {
        cacheBust: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.download = `macrooz-${date}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("Image exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const remaining = round(p.calorie_target - totals.calories);

  return (
    <div className="space-y-3">
      <DateNav date={date} onChange={setDate} />

      {/* Morning weigh-in */}
      <WeightCard
        weight={weights.find((w) => w.entry_date === date)?.weight ?? null}
        onSave={(w) =>
          upsertWeight.mutate(
            { entry_date: date, weight: w },
            { onSuccess: () => toast.success("Weight saved ✓") },
          )
        }
      />

      {/* Macro summary */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero text-primary-foreground">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Calories left</p>
              <p className="text-lg font-extrabold leading-none">
                {fmt(remaining)} <span className="text-xs font-medium text-muted-foreground">kcal</span>
              </p>
            </div>
          </div>
          <button
            onClick={exportImage}
            className="press flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <ProgressRing value={totals.calories} target={p.calorie_target} colorVar="var(--cal)" label="Calories" size={72} stroke={7} />
          <ProgressRing value={totals.protein} target={p.protein_target} colorVar="var(--protein)" label="Protein" unit="g" size={72} stroke={7} />
          <ProgressRing value={totals.carbs} target={p.carb_target} colorVar="var(--carbs)" label="Carbs" unit="g" size={72} stroke={7} />
          <ProgressRing value={totals.fat} target={p.fat_target} colorVar="var(--fat)" label="Fat" unit="g" size={72} stroke={7} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-full bg-muted p-1">
        {(["meals", "micros"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`press flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "meals" ? "Meals" : "Vitamins & Minerals"}
          </button>
        ))}
      </div>

      {tab === "meals" ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div ref={mealsRef} className="space-y-3 rounded-2xl">
            {MEALS.map((meal) => (
              <MealSection
                key={meal}
                meal={meal}
                logs={byMeal[meal] || []}
                onAddClick={(m) => setPickerMeal(m)}
                onUpdateGrams={(id, grams) => update.mutate({ id, grams })}
                onDelete={(id) => remove.mutate(id)}
                onDuplicate={handleDuplicate}
                onEdit={(log) => setEditLog(log)}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <MicrosList micros={totals.micros} goals={gMap} />
      )}

      {pickerMeal && (
        <FoodPicker
          meal={pickerMeal}
          open={!!pickerMeal}
          onOpenChange={(o) => !o && setPickerMeal(null)}
          onAdd={(food, grams) => handleAdd(food, grams, pickerMeal)}
        />
      )}

      {editLog && (
        <FoodPicker
          meal={editLog.meal as Meal}
          open={!!editLog}
          editLog={editLog}
          onOpenChange={(o) => !o && setEditLog(null)}
          onAdd={() => {}}
          onUpdate={(food, grams) => {
            update.mutate({
              id: editLog.id,
              grams,
              food_id: food.id,
              food_snapshot: foodToSnapshot(food),
            });
            toast.success("Item updated");
            setEditLog(null);
          }}
        />
      )}

      {/* End of Day Check-in */}
      <CheckinCard
        key={`${date}-${review?.id ?? "new"}`}
        review={review ?? null}
        onSave={(payload) =>
          upsertReview.mutate(payload, {
            onSuccess: () => toast.success("Check-in saved ✓"),
            onError: () => toast.error("Could not save check-in"),
          })
        }
      />
    </div>
  );
}

function CheckinCard({
  review,
  onSave,
}: {
  review: DailyReview | null;
  onSave: (payload: Partial<DailyReview>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sleep, setSleep] = useState(review?.sleep_hours != null ? Number(review.sleep_hours) : 7);
  const [diet, setDiet] = useState(review?.diet_adherence != null ? Number(review.diet_adherence) : 100);
  const [planned, setPlanned] = useState(review?.exercise_planned ?? false);
  const [completed, setCompleted] = useState(review?.exercise_completed ?? false);
  const [exAdherence, setExAdherence] = useState(
    review?.exercise_adherence != null ? Number(review.exercise_adherence) : 100,
  );

  const save = () => {
    onSave({
      sleep_hours: sleep,
      diet_adherence: diet,
      exercise_planned: planned,
      exercise_completed: planned ? completed : null,
      exercise_adherence: planned ? exAdherence : null,
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="press flex w-full items-center justify-between rounded-2xl border bg-card p-4 shadow-card">
        <span className="flex items-center gap-2 font-bold">
          <Moon className="h-4 w-4 text-primary" /> End of Day Check-in
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-5 rounded-2xl border bg-card p-4 shadow-card">
          {/* Sleep */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Moon className="h-4 w-4 text-primary" /> Hours of sleep
              </span>
              <span className="text-sm font-bold tabular-nums">{sleep.toFixed(1)} h</span>
            </div>
            <Slider
              min={0}
              max={12}
              step={0.5}
              value={[sleep]}
              onValueChange={(v) => setSleep(v[0])}
            />
          </div>

          {/* Diet adherence */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Salad className="h-4 w-4 text-primary" /> Diet adherence
              </span>
              <span className="text-sm font-bold tabular-nums">{diet}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[diet]}
              onValueChange={(v) => setDiet(magnetTo10(v[0]))}
            />
          </div>

          {/* Exercise planned */}
          <div>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Dumbbell className="h-4 w-4 text-primary" /> Exercise planned today?
            </span>
            <YesNo value={planned} onChange={setPlanned} />
          </div>

          {planned && (
            <div className="space-y-5 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div>
                <span className="text-sm font-semibold">Did you complete it?</span>
                <YesNo
                  value={completed}
                  onChange={(v) => {
                    setCompleted(v);
                    setExAdherence(v ? 100 : 0);
                  }}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Exercise adherence</span>
                  <span className="text-sm font-bold tabular-nums">{exAdherence}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[exAdherence]}
                  onValueChange={(v) => {
                    const next = magnetTo10(v[0]);
                    setExAdherence(next);
                    setCompleted(next > 0);
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={save}
            className="press flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3 font-bold text-primary-foreground"
          >
            <Save className="h-5 w-5" /> Save
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-1 flex rounded-full bg-muted p-1">
      {([["Yes", true], ["No", false]] as const).map(([label, v]) => (
        <button
          key={label}
          onClick={() => onChange(v)}
          className={`press flex-1 rounded-full py-2 text-sm font-semibold ${
            value === v ? "bg-card shadow-card" : "text-muted-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WeightCard({
  weight,
  onSave,
}: {
  weight: number | null;
  onSave: (w: number) => void;
}) {
  const { currentProfile, refetchProfiles } = useProfile();
  const [editing, setEditing] = useState(weight == null);
  const [value, setValue] = useState(weight != null ? String(weight) : "");
  const [savedWeight, setSavedWeight] = useState<number | null>(weight);
  const [program, setProgram] = useState<"same" | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  type Targets = {
    calorie_target: number;
    protein_target: number;
    carb_target: number;
    fat_target: number;
  };
  // Holds the initial, untouched diet plan. NEVER overwritten by "New Program".
  const originalProgramTargets = useRef<Targets | null>(null);
  // Holds the values calculated while "New Program" is active.
  const newProgramTargets = useRef<Targets | null>(null);

  useEffect(() => {
    setValue(weight != null ? String(weight) : "");
    setEditing(weight == null);
    setSavedWeight(weight);
    setProgram(null);
    // Reset both program memories when the day's weight context changes.
    originalProgramTargets.current = null;
    newProgramTargets.current = null;
  }, [weight]);

  const save = () => {
    const w = Number(value);
    if (!w) {
      toast.error("Enter a weight");
      return;
    }
    onSave(w);
    setSavedWeight(w);
    setEditing(false);
    setProgram(null);
  };

  const applyProgram = async (mode: "same" | "new") => {
    if (!currentProfile || savedWeight == null) return;

    // Capture the initial, untouched plan once — before any "New Program" edits.
    // At this point currentProfile still holds the original targets.
    if (originalProgramTargets.current == null) {
      originalProgramTargets.current = {
        calorie_target: currentProfile.calorie_target,
        protein_target: currentProfile.protein_target,
        carb_target: currentProfile.carb_target,
        fat_target: currentProfile.fat_target,
      };
    }

    setBusy(true);
    try {
      if (mode === "same") {
        // Reset completely back to the original targets, discarding any
        // "New Program" recalculations so they stay isolated.
        const orig = originalProgramTargets.current;
        const { error } = await supabase
          .from("profiles")
          .update({
            current_weight: savedWeight,
            calorie_target: orig.calorie_target,
            protein_target: orig.protein_target,
            carb_target: orig.carb_target,
            fat_target: orig.fat_target,
          } as never)
          .eq("id", currentProfile.id);
        if (error) throw error;
        toast.success("Weight updated · original targets restored");
      } else {
        // Recalculate targets entirely from the new weight.
        const input: CalcInput = {
          sex: currentProfile.sex,
          age: currentProfile.age ?? 0,
          height_cm: currentProfile.height_cm ?? 0,
          weight_kg: savedWeight,
          body_fat_pct: currentProfile.body_fat_pct,
          activity_level: currentProfile.activity_level,
          goal: currentProfile.diet_goal,
          protein_per_kg: currentProfile.protein_per_kg,
          fat_pct: currentProfile.fat_pct,
          calorie_adjust: currentProfile.calorie_adjust,
        };
        const r = computeMacros(currentProfile.calc_formula, input);
        if (!r) {
          toast.error("Add age, height & activity in Profile first");
          setBusy(false);
          return;
        }
        // Store the modified plan separately so it never touches the original.
        newProgramTargets.current = {
          calorie_target: r.calories,
          protein_target: r.protein,
          carb_target: r.carbs,
          fat_target: r.fat,
        };
        const next = newProgramTargets.current;
        const { error } = await supabase
          .from("profiles")
          .update({
            current_weight: savedWeight,
            calorie_target: next.calorie_target,
            protein_target: next.protein_target,
            carb_target: next.carb_target,
            fat_target: next.fat_target,
          } as never)
          .eq("id", currentProfile.id);
        if (error) throw error;
        toast.success("New program applied · targets updated");
      }
      setProgram(mode);
      refetchProfiles();
    } catch {
      toast.error("Could not update program");
    } finally {
      setBusy(false);
    }
  };

  const PROGRAMS = {
    same: {
      label: "Same Program",
      tip: "Updates your current weight record, but keeps your existing calorie and macro targets unchanged.",
    },
    new: {
      label: "New Program",
      tip: "Recalculates your daily calories and macros entirely based on your new weight.",
    },
  } as const;

  const InfoTip = ({ tip }: { tip: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Info"
          className="press flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-60 rounded-xl p-3 text-xs leading-relaxed"
      >
        {tip}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary">
          <Scale className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold">Morning Weigh-in</h2>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Weight"
              className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
          </div>
          <button
            onClick={save}
            className="press flex items-center justify-center rounded-xl gradient-hero px-4 text-primary-foreground"
            aria-label="Save weight"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-lg font-extrabold leading-none">
            {fmt(Number(savedWeight ?? weight), 1)} <span className="text-xs font-medium text-muted-foreground">kg</span>
          </p>
          <button
            onClick={() => setEditing(true)}
            className="press flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      )}

      {/* Program selector — appears once a weight is saved */}
      <AnimatePresence initial={false}>
        {!editing && savedWeight != null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center gap-2 pt-1">
              <AnimatePresence initial={false} mode="popLayout">
                {(["same", "new"] as const)
                  .filter((k) => program === null || program === k)
                  .map((k) => {
                    const active = program === k;
                    return (
                      <motion.div
                        key={k}
                        layout
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`flex items-center gap-1 overflow-hidden ${active ? "flex-1" : ""}`}
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => !active && applyProgram(k)}
                          className={`press flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                            active
                              ? "gradient-hero text-primary-foreground"
                              : "border bg-background text-foreground"
                          }`}
                        >
                          {active && <Check className="h-4 w-4 shrink-0" />}
                          {PROGRAMS[k].label}
                        </button>
                        {active ? (
                          <button
                            type="button"
                            onClick={() => setProgram(null)}
                            aria-label="Change program"
                            className="press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <InfoTip tip={PROGRAMS[k].tip} />
                        )}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
