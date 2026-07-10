import { useEffect, useMemo, useState } from "react";
import { Copy, CheckSquare, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFoodLogs } from "@/hooks/useData";
import { MEALS, MEAL_META, type Meal } from "@/lib/nutrients";
import { fmt } from "@/lib/nutrition";
import { sumLogs } from "@/lib/nutrition";
import type { FoodLog } from "@/lib/types";

function shift(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CopyYesterdayDialog({
  open,
  onOpenChange,
  profileId,
  date,
  onCopy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  profileId: string | null;
  date: string;
  onCopy: (logs: FoodLog[], meals: Meal[]) => void;
}) {
  const yesterday = useMemo(() => shift(date, -1), [date]);
  const { data: logs = [], isLoading } = useFoodLogs(profileId, yesterday);
  const [mode, setMode] = useState<"choose" | "select">("choose");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setMode("choose");
      const init: Record<string, boolean> = {};
      for (const m of MEALS) init[m] = true;
      setChecked(init);
    }
  }, [open]);

  const byMeal = useMemo(() => {
    const m: Record<string, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    for (const l of logs) (m[l.meal] ||= []).push(l);
    return m;
  }, [logs]);

  const doCopyAll = () => {
    onCopy(logs, [...MEALS] as Meal[]);
    onOpenChange(false);
  };

  const doCopySelected = () => {
    const meals = (MEALS as readonly Meal[]).filter((m) => checked[m]);
    const picked = logs.filter((l) => checked[l.meal]);
    onCopy(picked, meals);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" /> Copy Yesterday's Meals
          </DialogTitle>
          <DialogDescription>From {yesterday}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing logged yesterday.
          </p>
        ) : mode === "choose" ? (
          <div className="space-y-2">
            <button
              onClick={doCopyAll}
              className="press w-full rounded-xl gradient-hero p-3 text-left font-bold text-primary-foreground"
            >
              Copy All
              <span className="ml-2 text-xs font-normal opacity-90">
                {logs.length} items · {fmt(sumLogs(logs).calories)} kcal
              </span>
            </button>
            <button
              onClick={() => setMode("select")}
              className="press w-full rounded-xl border bg-card p-3 text-left font-bold"
            >
              Select Meals
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Pick which meals to copy
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(MEALS as readonly Meal[]).map((m) => {
              const mLogs = byMeal[m] || [];
              const isChecked = checked[m] ?? false;
              const disabled = mLogs.length === 0;
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => setChecked((c) => ({ ...c, [m]: !c[m] }))}
                  className={`press flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left ${
                    disabled ? "opacity-40" : ""
                  }`}
                >
                  {isChecked && !disabled ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-lg">{MEAL_META[m].icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{MEAL_META[m].label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {mLogs.length} items · {fmt(sumLogs(mLogs).calories)} kcal
                    </p>
                  </div>
                </button>
              );
            })}
            <button
              onClick={doCopySelected}
              className="press mt-2 w-full rounded-xl gradient-hero py-3 font-bold text-primary-foreground"
            >
              Copy Selected
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
