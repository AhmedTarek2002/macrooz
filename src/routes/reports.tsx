import { useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toPng } from "html-to-image";
import { ChevronDown, Download, Flame, Moon, Dumbbell, Salad, Scale } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/context/ProfileProvider";
import { supabase } from "@/integrations/supabase/client";
import { MEALS, MEAL_META } from "@/lib/nutrients";
import { sumLogs, scaleSnapshot, todayStr, fmt } from "@/lib/nutrition";
import type { DailyReview, FoodLog, WeightEntry } from "@/lib/types";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Macrooz" }] }),
  component: () => (
    <AppShell title="Reports" subtitle="Your trends & averages">
      <ReportsPage />
    </AppShell>
  ),
});

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

function ReportsPage() {
  const { currentProfile } = useProfile();
  const pid = currentProfile?.id ?? null;
  const chartRef = useRef<HTMLDivElement>(null);

  const [to, setTo] = useState(todayStr());
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [openDay, setOpenDay] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["report", pid, from, to],
    enabled: !!pid,
    queryFn: async () => {
      const [logsRes, reviewsRes, weightsRes] = await Promise.all([
        supabase.from("food_logs").select("*").eq("profile_id", pid!).gte("log_date", from).lte("log_date", to),
        supabase.from("daily_reviews").select("*").eq("profile_id", pid!).gte("review_date", from).lte("review_date", to),
        supabase.from("weight_entries").select("*").eq("profile_id", pid!).gte("entry_date", from).lte("entry_date", to).order("entry_date"),
      ]);
      return {
        logs: (logsRes.data || []) as unknown as FoodLog[],
        reviews: (reviewsRes.data || []) as unknown as DailyReview[],
        weights: (weightsRes.data || []) as unknown as WeightEntry[],
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const byDate: Record<string, FoodLog[]> = {};
    for (const l of data.logs) (byDate[l.log_date] ||= []).push(l);
    const days = Object.keys(byDate).sort();
    const dailyTotals = days.map((d) => ({ date: d.slice(5), ...sumLogs(byDate[d]) }));
    const n = dailyTotals.length || 1;
    const avg = (k: "calories" | "protein" | "carbs" | "fat") =>
      dailyTotals.reduce((s, d) => s + d[k], 0) / n;

    const r = data.reviews;
    const avgOf = (vals: (number | null)[]) => {
      const nums = vals.filter((v): v is number => v != null);
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    };

    return {
      dailyTotals,
      avgCal: avg("calories"),
      avgProtein: avg("protein"),
      avgCarbs: avg("carbs"),
      avgFat: avg("fat"),
      avgSleep: avgOf(r.map((x) => x.sleep_hours)),
      avgExercise: avgOf(r.map((x) => x.exercise_adherence)),
      avgDiet: avgOf(r.map((x) => x.diet_adherence)),
      weights: data.weights.map((w) => ({ date: w.entry_date.slice(5), weight: Number(w.weight) })),
      loggedDays: days.length,
    };
  }, [data]);

  const exportReport = async () => {
    if (!chartRef.current) return;
    const url = await toPng(chartRef.current, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.download = "macrooz-report.png";
    a.href = url;
    a.click();
  };

  const setPreset = (days: number) => {
    setTo(todayStr());
    setFrom(addDays(todayStr(), -(days - 1)));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex gap-2">
          {[["7d", 7], ["30d", 30], ["90d", 90]].map(([l, d]) => (
            <button
              key={l as string}
              onClick={() => setPreset(d as number)}
              className="press flex-1 rounded-xl bg-muted py-2 text-sm font-semibold"
            >
              {l as string}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm" />
          <span className="text-muted-foreground">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Avg calories" value={fmt(stats?.avgCal ?? 0)} unit="kcal" grad="gradient-hero" />
        <StatCard icon={<Moon className="h-4 w-4" />} label="Avg sleep" value={fmt(stats?.avgSleep ?? 0, 1)} unit="h" grad="bg-fat" />
        <StatCard icon={<Dumbbell className="h-4 w-4" />} label="Exercise adh." value={fmt(stats?.avgExercise ?? 0)} unit="%" grad="gradient-fresh" />
        <StatCard icon={<Salad className="h-4 w-4" />} label="Diet adh." value={fmt(stats?.avgDiet ?? 0)} unit="%" grad="bg-carbs" />
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-card p-3 text-center shadow-card">
        {[["Protein", stats?.avgProtein, "protein"], ["Carbs", stats?.avgCarbs, "carbs"], ["Fat", stats?.avgFat, "fat"]].map(([l, v, c]) => (
          <div key={l as string}>
            <p className={`text-lg font-bold text-${c}`}>{fmt((v as number) ?? 0)}g</p>
            <p className="text-[10px] text-muted-foreground">avg {l as string}</p>
          </div>
        ))}
      </div>

      <div ref={chartRef} className="space-y-4">
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Daily calories</h2>
            <button onClick={exportReport} className="press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
          {stats && stats.dailyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.dailyTotals} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="calories" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No logged meals in this range.</p>
          )}
        </section>

        {stats && stats.weights.length > 1 && (
          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="mb-2 font-bold">Weight trend</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.weights} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Based on {stats?.loggedDays ?? 0} logged day(s). Updates automatically when you edit any day.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, unit, grad }: { icon: ReactNode; label: string; value: string; unit: string; grad: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card">
      <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl text-primary-foreground ${grad}`}>{icon}</span>
      <p className="text-xl font-extrabold leading-none">{value}<span className="text-xs font-medium text-muted-foreground"> {unit}</span></p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
