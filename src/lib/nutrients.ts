// Vitamin & mineral definitions used across the app.
// `unit` is the display unit; values in foods.micros are stored in these units per 100g.

export type NutrientDef = {
  key: string;
  label: string;
  unit: string;
  defaultRda: number | null;
  defaultUl: number | null;
};

export const VITAMINS: NutrientDef[] = [
  { key: "vit_a", label: "Vitamin A", unit: "mcg", defaultRda: 900, defaultUl: 3000 },
  { key: "vit_c", label: "Vitamin C", unit: "mg", defaultRda: 90, defaultUl: 2000 },
  { key: "vit_d", label: "Vitamin D", unit: "mcg", defaultRda: 15, defaultUl: 100 },
  { key: "vit_e", label: "Vitamin E", unit: "mg", defaultRda: 15, defaultUl: 1000 },
  { key: "vit_k", label: "Vitamin K", unit: "mcg", defaultRda: 120, defaultUl: null },
  { key: "b1", label: "B1 Thiamin", unit: "mg", defaultRda: 1.2, defaultUl: null },
  { key: "b2", label: "B2 Riboflavin", unit: "mg", defaultRda: 1.3, defaultUl: null },
  { key: "b3", label: "B3 Niacin", unit: "mg", defaultRda: 16, defaultUl: 35 },
  { key: "b5", label: "B5 Pantothenic", unit: "mg", defaultRda: 5, defaultUl: null },
  { key: "b6", label: "B6", unit: "mg", defaultRda: 1.3, defaultUl: 100 },
  { key: "b7", label: "B7 Biotin", unit: "mcg", defaultRda: 30, defaultUl: null },
  { key: "b9", label: "B9 Folate", unit: "mcg", defaultRda: 400, defaultUl: 1000 },
  { key: "b12", label: "B12", unit: "mcg", defaultRda: 2.4, defaultUl: null },
];

export const MINERALS: NutrientDef[] = [
  { key: "calcium", label: "Calcium", unit: "mg", defaultRda: 1000, defaultUl: 2500 },
  { key: "iron", label: "Iron", unit: "mg", defaultRda: 8, defaultUl: 45 },
  { key: "magnesium", label: "Magnesium", unit: "mg", defaultRda: 400, defaultUl: 750 },
  { key: "phosphorus", label: "Phosphorus", unit: "mg", defaultRda: 700, defaultUl: 4000 },
  { key: "potassium", label: "Potassium", unit: "mg", defaultRda: 3500, defaultUl: null },
  { key: "sodium", label: "Sodium", unit: "mg", defaultRda: 2300, defaultUl: 2300 },
  { key: "zinc", label: "Zinc", unit: "mg", defaultRda: 11, defaultUl: 40 },
  { key: "copper", label: "Copper", unit: "mg", defaultRda: 0.9, defaultUl: 10 },
  { key: "manganese", label: "Manganese", unit: "mg", defaultRda: 2.3, defaultUl: 11 },
  { key: "selenium", label: "Selenium", unit: "mcg", defaultRda: 55, defaultUl: 400 },
  { key: "iodine", label: "Iodine", unit: "mcg", defaultRda: 150, defaultUl: 1100 },
];

export const ALL_NUTRIENTS: NutrientDef[] = [...VITAMINS, ...MINERALS];

export const NUTRIENT_BY_KEY: Record<string, NutrientDef> = Object.fromEntries(
  ALL_NUTRIENTS.map((n) => [n.key, n]),
);

export const FOOD_CATEGORIES = [
  "Protein",
  "Dairy",
  "Grains",
  "Vegetable",
  "Fruit",
  "Legumes",
  "Nuts",
  "Fats",
  "Snacks",
  "Drinks",
  "Supplements",
  "Other",
];

export const MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_META: Record<Meal, { label: string; icon: string }> = {
  breakfast: { label: "Breakfast", icon: "🌅" },
  lunch: { label: "Lunch", icon: "🥗" },
  dinner: { label: "Dinner", icon: "🍽️" },
  snacks: { label: "Snacks", icon: "🍿" },
};
