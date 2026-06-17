// Calorie & macro calculator: BMR via 3 popular formulas, TDEE, and macro split.

export type Sex = "male" | "female";
export type FormulaKey = "mifflin" | "harris" | "katch";

export type CalcInput = {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct: number | null; // required only for Katch-McArdle
  activity_level: number; // multiplier 1.2 – 1.9
  goal: "lose" | "maintain" | "gain";
  protein_per_kg: number; // advanced, default 2
  fat_pct: number; // advanced, % of calories from fat, default 25
  calorie_adjust: number; // advanced, surplus (gain) / deficit (lose) in kcal, default 500
};

export type FormulaDef = {
  key: FormulaKey;
  name: string;
  blurb: string;
  needsBodyFat: boolean;
};

export const FORMULAS: FormulaDef[] = [
  {
    key: "mifflin",
    name: "Mifflin-St Jeor",
    blurb: "Most accurate for the general population. Recommended default.",
    needsBodyFat: false,
  },
  {
    key: "harris",
    name: "Harris-Benedict (Revised)",
    blurb: "Classic equation, slightly higher estimates.",
    needsBodyFat: false,
  },
  {
    key: "katch",
    name: "Katch-McArdle",
    blurb: "Uses body-fat % and lean mass. Best if you know your body fat.",
    needsBodyFat: true,
  },
];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentary", desc: "Little or no exercise" },
  { value: 1.375, label: "Light", desc: "Exercise 1–3 days/week" },
  { value: 1.55, label: "Moderate", desc: "Exercise 3–5 days/week" },
  { value: 1.725, label: "Active", desc: "Exercise 6–7 days/week" },
  { value: 1.9, label: "Very active", desc: "Hard exercise + physical job" },
] as const;

export const GOAL_ADJUST: Record<CalcInput["goal"], number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

// Returns BMR (basal metabolic rate) in kcal/day, or null if inputs are insufficient.
export function calcBMR(formula: FormulaKey, i: CalcInput): number | null {
  const { sex, age, height_cm, weight_kg, body_fat_pct } = i;
  if (!age || !height_cm || !weight_kg) return null;

  if (formula === "mifflin") {
    const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
    return sex === "male" ? base + 5 : base - 161;
  }
  if (formula === "harris") {
    return sex === "male"
      ? 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age
      : 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.33 * age;
  }
  // katch-mcardle
  if (body_fat_pct == null || body_fat_pct <= 0) return null;
  const lbm = weight_kg * (1 - body_fat_pct / 100);
  return 370 + 21.6 * lbm;
}

export type MacroResult = {
  bmr: number;
  tdee: number;
  calories: number; // after goal adjustment
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
};

export function computeMacros(formula: FormulaKey, i: CalcInput): MacroResult | null {
  const bmr = calcBMR(formula, i);
  if (bmr == null) return null;

  const tdee = bmr * i.activity_level;
  const calories = Math.max(0, tdee + GOAL_ADJUST[i.goal]);

  const protein = i.protein_per_kg * i.weight_kg;
  const proteinCals = protein * 4;

  const fatCals = calories * (i.fat_pct / 100);
  const fat = fatCals / 9;

  const carbCals = Math.max(0, calories - proteinCals - fatCals);
  const carbs = carbCals / 4;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
}
