import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dumbbell, Moon, Save, Salad } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DateNav } from "@/components/DateNav";
import { Slider } from "@/components/ui/slider";
import { useProfile } from "@/context/ProfileProvider";
import {
  useDailyReview,
  useReviewMutations,
  useFoodLogs,
  useWeightEntries,
} from "@/hooks/useData";
import { sumLogs, todayStr, fmt, macroStatus } from "@/lib/nutrition";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Daily Review — Macrooz" }] }),
  component: () => (
    <AppShell title="Daily Review" subtitle="End-of-day check-in">
      <ReviewPage />
    </AppShell>
  ),
});

function ReviewPage() {
  const { currentProfile } = useProfile();
  const pid = currentProfile?.id ?? null;
  const [date, setDate] = useState(todayStr());

  const { data: review } = useDailyReview(pid, date);
  const { upsert } = useReviewMutations(pid, date);
  const { data: logs = [] } = useFoodLogs(pid, date);
  const { data: weights = [] } = useWeightEntries(pid);

  const [planned, setPlanned] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [exAdh, setExAdh] = useState(0);
  const [dietAdh, setDietAdh] = useState(0);
  const [sleep, setSleep] = useState("");

  useEffect(() => {
    setPlanned(review?.exercise_planned ?? false);
    setCompleted(review?.exercise_completed ?? false);
    setExAdh(review?.exercise_adherence ?? 0);
    setDietAdh(review?.diet_adherence ?? 0);
    setSleep(review?.sleep_hours != null ? String(review.sleep_hours) : "");
  }, [review, date]);

  const totals = sumLogs(logs);
  const p = currentProfile!;
  const dayWeight = weights.find((w) => w.entry_date === date)?.weight;

  const save = () => {
    upsert.mutate(
      {
        exercise_planned: planned,
        exercise_completed: planned ? completed : null,
        exercise_adherence: exAdh,
        diet_adherence: dietAdh,
        sleep_hours: sleep === "" ? null : Number(sleep),
      },
      { onSuccess: () => toast.success("Review saved ✓") },
    );
  };

  return (
    <div className="space-y-4">
      <DateNav date={date} onChange={setDate} />

      {/* Daily summary */}
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
          {dayWeight != null && (
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="font-medium">Weight</span>
              <span className="font-bold">{fmt(Number(dayWeight), 1)} kg</span>
            </div>
          )}
        </div>
      </section>

      {/* Exercise */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold">
            <Dumbbell className="h-4 w-4 text-primary" /> Exercise planned?
          </span>
          <button
            onClick={() => setPlanned((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${planned ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform ${planned ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {planned && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 p-3">
            <span className="text-sm font-medium">Did you complete it?</span>
            <div className="flex gap-2">
              {[["Yes", true], ["No", false]].map(([l, v]) => (
                <button
                  key={l as string}
                  onClick={() => setCompleted(v as boolean)}
                  className={`press rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    completed === v ? "gradient-hero text-primary-foreground" : "bg-card"
                  }`}
                >
                  {l as string}
                </button>
              ))}
            </div>
          </div>
        )}

        <SliderRow label="Exercise adherence" value={exAdh} onChange={setExAdh} icon={<Dumbbell className="h-4 w-4" />} />
        <SliderRow label="Diet adherence" value={dietAdh} onChange={setDietAdh} icon={<Salad className="h-4 w-4" />} />
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold">
            <Moon className="h-4 w-4 text-primary" /> Hours of sleep
          </span>
          <input
            type="number"
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="0"
            className="w-24 rounded-xl border bg-background px-3 py-2 text-center outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </section>

      <button onClick={save} className="press flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground">
        <Save className="h-5 w-5" /> Save review
      </button>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">{icon} {label}</span>
        <span className="font-bold text-primary">{value}%</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={5} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
