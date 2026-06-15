import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Download, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile } from "@/context/ProfileProvider";
import { useWeightEntries, useWeightMutations } from "@/hooks/useData";
import { todayStr, fmt } from "@/lib/nutrition";

export const Route = createFileRoute("/weight")({
  head: () => ({ meta: [{ title: "Weight Tracker — Macrooz" }] }),
  component: () => (
    <AppShell title="Weight Tracker" subtitle="Track your progress">
      <WeightPage />
    </AppShell>
  ),
});

function WeightPage() {
  const { currentProfile } = useProfile();
  const pid = currentProfile?.id ?? null;
  const { data: entries = [] } = useWeightEntries(pid);
  const { upsert, remove } = useWeightMutations(pid);
  const chartRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  const years = useMemo(
    () => Array.from(new Set(entries.map((e) => e.entry_date.slice(0, 4)))).sort().reverse(),
    [entries],
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (year !== "all" && e.entry_date.slice(0, 4) !== year) return false;
      if (month !== "all" && e.entry_date.slice(5, 7) !== month) return false;
      return true;
    });
  }, [entries, year, month]);

  const chartData = filtered.map((e) => ({
    date: e.entry_date.slice(5),
    weight: Number(e.weight),
  }));

  const first = filtered[0]?.weight;
  const last = filtered[filtered.length - 1]?.weight;
  const delta = first != null && last != null ? Number(last) - Number(first) : 0;

  const save = () => {
    const w = Number(weight);
    if (!w) return toast.error("Enter a weight");
    upsert.mutate({ entry_date: date, weight: w }, { onSuccess: () => { setWeight(""); toast.success("Weight saved"); } });
  };

  const exportChart = async () => {
    if (!chartRef.current) return;
    const url = await toPng(chartRef.current, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.download = "macrooz-weight.png";
    a.href = url;
    a.click();
    toast.success("Chart exported");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Log weight</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="relative w-28">
            <input
              type="number"
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="kg"
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-center outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={save} className="press flex items-center justify-center rounded-xl gradient-hero px-4 text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section ref={chartRef} className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-bold">Trend</h2>
            {filtered.length > 1 && (
              <p className={`flex items-center gap-1 text-xs font-semibold ${delta <= 0 ? "text-status-good" : "text-status-over"}`}>
                {delta <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {fmt(Math.abs(delta), 1)} kg {delta <= 0 ? "down" : "up"}
              </p>
            )}
          </div>
          <button onClick={exportChart} className="press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg border bg-background px-2 py-1.5 text-sm">
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border bg-background px-2 py-1.5 text-sm">
            <option value="all">All months</option>
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
              <option key={m} value={m}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "short" })}</option>
            ))}
          </select>
        </div>

        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No weight entries yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-2 shadow-card">
        {[...filtered].reverse().map((e) => (
          <div key={e.id} className="flex items-center justify-between border-b px-2 py-2.5 last:border-0">
            <span className="text-sm text-muted-foreground">
              {new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-bold tabular-nums">{fmt(Number(e.weight), 1)} kg</span>
              <button onClick={() => remove.mutate(e.id)} className="press text-status-over">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No entries for this period.</p>}
      </section>
    </div>
  );
}
