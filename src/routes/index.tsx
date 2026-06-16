import { useMemo, useRef, useState } from "react";
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
import { Download, Flame, Scale, Pencil, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DateNav } from "@/components/DateNav";
import { MealSection } from "@/components/MealSection";
import { FoodPicker } from "@/components/FoodPicker";
import { MicrosList } from "@/components/MicrosList";
import { ProgressRing } from "@/components/ProgressRing";
import { useProfile } from "@/context/ProfileProvider";
import { useFoodLogs, useFoodLogMutations, useNutrientGoals, useWeightEntries, useWeightMutations } from "@/hooks/useData";
import { MEALS, type Meal } from "@/lib/nutrients";
import { sumLogs, foodToSnapshot, goalsMap, todayStr, fmt, round } from "@/lib/nutrition";
import type { Food, FoodLog } from "@/lib/types";

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
    </div>
  );
}
