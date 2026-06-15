import { VITAMINS, MINERALS, type NutrientDef } from "@/lib/nutrients";
import { nutrientStatus, fmt, type Status } from "@/lib/nutrition";
import type { Micros, NutrientGoal } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const BAR: Record<Status, string> = {
  low: "bg-status-low",
  almost: "bg-status-almost",
  good: "bg-status-good",
  over: "bg-status-over",
  none: "bg-muted-foreground",
};

function Row({
  def,
  value,
  goal,
}: {
  def: NutrientDef;
  value: number;
  goal?: NutrientGoal;
}) {
  const rda = goal?.rda ?? def.defaultRda;
  const ul = goal?.upper_limit ?? def.defaultUl;
  const status = nutrientStatus(value, rda, ul);
  const pct = rda ? Math.min(100, (value / rda) * 100) : value > 0 ? 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{def.label}</span>
        <span className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="tabular-nums text-muted-foreground">
            {fmt(value, value < 10 ? 1 : 0)}
            {rda ? ` / ${fmt(rda, rda < 10 ? 1 : 0)}` : ""} {def.unit}
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${BAR[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MicrosList({
  micros,
  goals,
}: {
  micros: Micros;
  goals: Record<string, NutrientGoal>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-bold text-muted-foreground">Vitamins</h3>
        <div className="rounded-2xl border bg-card px-3 shadow-card">
          {VITAMINS.map((d) => (
            <Row key={d.key} def={d} value={micros[d.key] || 0} goal={goals[d.key]} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-bold text-muted-foreground">Minerals</h3>
        <div className="rounded-2xl border bg-card px-3 shadow-card">
          {MINERALS.map((d) => (
            <Row key={d.key} def={d} value={micros[d.key] || 0} goal={goals[d.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}
