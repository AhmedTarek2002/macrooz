export type Profile = {
  id: string;
  name: string;
  color: string;
  theme: "light" | "dark";
  current_weight: number | null;
  target_weight: number | null;
  diet_goal: "lose" | "gain" | "maintain";
  sex: "male" | "female";
  age: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  activity_level: number;
  protein_per_kg: number;
  fat_pct: number;
  calc_formula: "mifflin" | "harris" | "katch";
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  fiber_target: number;
  omega3_target: number;
  created_at: string;
  updated_at: string;
};

export type Micros = Record<string, number>;

export type Food = {
  id: string;
  name: string;
  category: string;
  icon: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  omega3: number;
  micros: Micros;
  created_at: string;
  updated_at: string;
};

export type FoodSnapshot = {
  name: string;
  icon: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  omega3: number;
  micros: Micros;
};

export type FoodLog = {
  id: string;
  profile_id: string;
  food_id: string | null;
  log_date: string;
  meal: string;
  grams: number;
  position: number;
  food_snapshot: FoodSnapshot;
  created_at: string;
};

export type WeightEntry = {
  id: string;
  profile_id: string;
  entry_date: string;
  weight: number;
  created_at: string;
};

export type NutrientGoal = {
  id: string;
  profile_id: string;
  nutrient_key: string;
  rda: number | null;
  upper_limit: number | null;
};

export type DailyReview = {
  id: string;
  profile_id: string;
  review_date: string;
  exercise_planned: boolean;
  exercise_completed: boolean | null;
  exercise_adherence: number | null;
  diet_adherence: number | null;
  sleep_hours: number | null;
  notes: string | null;
};
