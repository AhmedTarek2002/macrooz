import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Moon, Salad, Scale, Pill } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DateNav } from "@/components/DateNav";
import { useProfile } from "@/context/ProfileProvider";
import {
  useDailyReview,
  useFoodLogs,
  useWeightEntries,
  useNutrientGoals,
} from "@/hooks/useData";
import { sumLogs, todayStr, fmt, macroStatus, goalsMap } from "@/lib/nutrition";
import { ALL_NUTRIENTS } from "@/lib/nutrients";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Daily Review — Macrooz" }] }),
  component: () => (
    <AppShell title="Daily Review" subtitle="End-of-day summary">
      <ReviewPage />
    </AppShell>
  ),
});

function ReviewPage() {
  const { currentProfile } = useProfile();
  const pid = currentProfile?.id ?? null;
  const [date, setDate] = useState(todayStr());

  const { data: review } = useDailyReview(pid, date);
  const { data: logs = [] } = useFoodLogs(pid, date);
  const { data: weights = [] } = useWeightEntries(pid);
  const { data: goals = [] } = useNutrientGoals(pid);

  const totals = sumLogs(logs);
  const p = currentProfile!;
  const dayWeight = weights.find((w) => w.entry_date === date)?.weight ?? null;

  // Vitamins & minerals adherence: average of each nutrient's completion (capped at 100%).
  const goalById = goalsMap(goals);
  const microScore = (() => {
    const tracked = ALL_NUTRIENTS.filter((n) => {
      const rda = goalById[n.key]?.rda ?? n.defaultRda;
      return rda != null && rda > 0;
    });
    if (tracked.length === 0) return null;
    const sum = tracked.reduce((acc, n) => {
      const rda = (goalById[n.key]?.rda ?? n.defaultRda)!;
      const consumed = totals.micros[n.key] || 0;
      return acc + Math.min(100, (consumed / rda) * 100);
    }, 0);
    return Math.round(sum / tracked.length);
  })();

  return (
    <div className="space-y-4">
      <DateNav date={date} onChange={setDate} />

      {/* Macro summary */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Daily summary</h2>
        <div className="space-y-2">
          {[
            ["Calories", totals.calories, p.calorie_target, "kcal"],
            ["Protein", totals.protein, p.protein_target, "g"],
            ["Carbs", totals.carbs, p.carb_target, "g"],
            ["Fat", totals.fat, p.fat_target, "g"],
            ["Fiber", totals.fiber, p.fiber_target, "g"],
          ].map(([label, val, target, unit]) => (
            <div key={label as string} className="flex items-center justify-between text-sm">
              <span className="font-medium">{label as string}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={macroStatus(val as number, target as number)} />
                <span className="tabular-nums text-muted-foreground">
                  {fmt(val as number)} / {fmt(target as number)} {unit as string}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Body & lifestyle */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Body &amp; lifestyle</h2>
        <div className="space-y-2.5">
          <Row
            icon={<Scale className="h-4 w-4 text-primary" />}
            label="Weight"
            value={dayWeight != null ? `${fmt(Number(dayWeight), 1)} kg` : "—"}
          />
          <Row
            icon={<Moon className="h-4 w-4 text-primary" />}
            label="Sleep"
            value={review?.sleep_hours != null ? `${fmt(Number(review.sleep_hours), 1)} h` : "—"}
          />
          <Row
            icon={<Dumbbell className="h-4 w-4 text-primary" />}
            label="Exercise adherence"
            value={review?.exercise_adherence != null ? `${review.exercise_adherence}%` : "—"}
          />
          <Row
            icon={<Salad className="h-4 w-4 text-primary" />}
            label="Diet adherence"
            value={review?.diet_adherence != null ? `${review.diet_adherence}%` : "—"}
          />
        </div>
      </section>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 font-medium">
        {icon} {label}
      </span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
