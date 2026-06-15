import type { Food, FoodLog, FoodSnapshot, Micros, NutrientGoal } from "./types";
import { ALL_NUTRIENTS } from "./nutrients";

export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  omega3: number;
  micros: Micros;
};

export function emptyTotals(): Totals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, omega3: 0, micros: {} };
}

export function foodToSnapshot(food: Food): FoodSnapshot {
  return {
    name: food.name,
    icon: food.icon,
    category: food.category,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    omega3: food.omega3,
    micros: food.micros || {},
  };
}

// Scale a per-100g snapshot to a number of grams.
export function scaleSnapshot(s: FoodSnapshot, grams: number) {
  const f = grams / 100;
  const micros: Micros = {};
  for (const [k, v] of Object.entries(s.micros || {})) micros[k] = (v || 0) * f;
  return {
    calories: s.calories * f,
    protein: s.protein * f,
    carbs: s.carbs * f,
    fat: s.fat * f,
    fiber: s.fiber * f,
    omega3: s.omega3 * f,
    micros,
  };
}

export function sumLogs(logs: FoodLog[]): Totals {
  const t = emptyTotals();
  for (const log of logs) {
    const scaled = scaleSnapshot(log.food_snapshot, log.grams);
    t.calories += scaled.calories;
    t.protein += scaled.protein;
    t.carbs += scaled.carbs;
    t.fat += scaled.fat;
    t.fiber += scaled.fiber;
    t.omega3 += scaled.omega3;
    for (const [k, v] of Object.entries(scaled.micros)) {
      t.micros[k] = (t.micros[k] || 0) + v;
    }
  }
  return t;
}

export type Status = "low" | "almost" | "good" | "over" | "none";

export const STATUS_LABEL: Record<Status, string> = {
  low: "Low",
  almost: "Almost there",
  good: "On track",
  over: "Exceeded",
  none: "—",
};

export const STATUS_COLOR: Record<Status, string> = {
  low: "status-low",
  almost: "status-almost",
  good: "status-good",
  over: "status-over",
  none: "muted-foreground",
};

// Generic status for nutrients with a requirement (and optional upper limit).
export function nutrientStatus(value: number, rda: number | null, ul: number | null): Status {
  if (ul != null && value > ul) return "over";
  if (rda == null || rda <= 0) return value > 0 ? "good" : "none";
  const pct = value / rda;
  if (pct < 0.5) return "low";
  if (pct < 0.85) return "almost";
  return "good";
}

// Status for macros/calories against a target. Going well over the target counts as "Exceeded".
export function macroStatus(value: number, target: number): Status {
  if (target <= 0) return "none";
  const pct = value / target;
  if (pct > 1.1) return "over";
  if (pct < 0.5) return "low";
  if (pct < 0.85) return "almost";
  return "good";
}

export function goalsMap(goals: NutrientGoal[]): Record<string, NutrientGoal> {
  return Object.fromEntries(goals.map((g) => [g.nutrient_key, g]));
}

export function defaultGoalFor(key: string): { rda: number | null; ul: number | null } {
  const def = ALL_NUTRIENTS.find((n) => n.key === key);
  return { rda: def?.defaultRda ?? null, ul: def?.defaultUl ?? null };
}

export function round(n: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

export function fmt(n: number, d = 0): string {
  return round(n, d).toLocaleString(undefined, { maximumFractionDigits: d });
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
