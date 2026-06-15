import { useEffect, useMemo, useState } from "react";
import { Search, Minus, Plus, Check, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useFoods } from "@/hooks/useData";
import { FOOD_CATEGORIES, MEAL_META, type Meal } from "@/lib/nutrients";
import { foodToSnapshot, fmt } from "@/lib/nutrition";
import type { Food, FoodLog } from "@/lib/types";

const PRESETS = [50, 100, 200];

export function FoodPicker({
  meal,
  open,
  onOpenChange,
  onAdd,
  editLog,
  onUpdate,
}: {
  meal: Meal;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (food: Food, grams: number) => void;
  editLog?: FoodLog | null;
  onUpdate?: (food: Food, grams: number) => void;
}) {
  const { data: foods = [] } = useFoods();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const isEdit = !!editLog;

  // When editing, jump straight to the current food's detail with its grams.
  useEffect(() => {
    if (open && editLog) {
      const current = foods.find((f) => f.id === editLog.food_id) ?? null;
      setSelected(current);
      setGrams(editLog.grams);
    }
  }, [open, editLog, foods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      const matchCat = cat === "All" || f.category === cat;
      const matchQ = !q || f.name.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [foods, query, cat]);

  const reset = () => {
    setSelected(null);
    setGrams(100);
  };

  const handleAdd = () => {
    if (!selected) return;
    if (isEdit && onUpdate) {
      onUpdate(selected, grams);
    } else {
      onAdd(selected, grams);
    }
    reset();
    onOpenChange(false);
  };


  const scaled = selected ? grams / 100 : 1;

  return (
    <Drawer open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <span>{MEAL_META[meal].icon}</span> Add to {MEAL_META[meal].label}
          </DrawerTitle>
        </DrawerHeader>

        {!selected ? (
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods…"
                dir="auto"
                className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {["All", ...FOOD_CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`press whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                    cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No foods found.</p>
              )}
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelected(f)}
                  className="press flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                    {f.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" dir="auto">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmt(f.calories)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)} /100g
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-8">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-2xl">
                {selected.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" dir="auto">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
              </div>
              <button onClick={reset} className="press rounded-full bg-muted p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setGrams(p)}
                  className={`press rounded-xl py-2.5 text-sm font-bold ${
                    grams === p ? "gradient-hero text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {p}g
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setGrams((g) => Math.max(0, g - 10))}
                className="press flex h-12 w-12 items-center justify-center rounded-xl border bg-card"
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border bg-background py-3 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">g</span>
              </div>
              <button
                onClick={() => setGrams((g) => g + 10)}
                className="press flex h-12 w-12 items-center justify-center rounded-xl border bg-card"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-muted/60 p-3 text-center">
              {[
                ["kcal", selected.calories * scaled, "cal"],
                ["Protein", selected.protein * scaled, "protein"],
                ["Carbs", selected.carbs * scaled, "carbs"],
                ["Fat", selected.fat * scaled, "fat"],
              ].map(([label, val, color]) => (
                <div key={label as string}>
                  <p className={`text-base font-bold text-${color}`}>{fmt(val as number)}</p>
                  <p className="text-[10px] text-muted-foreground">{label as string}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleAdd}
              className="press mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground"
            >
              <Check className="h-5 w-5" /> Add {grams}g
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
