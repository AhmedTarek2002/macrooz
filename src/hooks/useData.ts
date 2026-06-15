import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DailyReview, Food, FoodLog, NutrientGoal, WeightEntry } from "@/lib/types";

/* ----------------------------- FOODS ----------------------------- */

export function useFoods() {
  return useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("foods").select("*").order("name");
      if (error) throw error;
      return data as unknown as Food[];
    },
  });
}

export function useFoodMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["foods"] });

  const create = useMutation({
    mutationFn: async (food: Partial<Food>) => {
      const { error } = await supabase.from("foods").insert(food as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...food }: Partial<Food> & { id: string }) => {
      const { error } = await supabase.from("foods").update(food as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("foods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

/* --------------------------- FOOD LOGS --------------------------- */

export function useFoodLogs(profileId: string | null, date: string) {
  return useQuery({
    queryKey: ["food_logs", profileId, date],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("profile_id", profileId!)
        .eq("log_date", date)
        .order("position");
      if (error) throw error;
      return data as unknown as FoodLog[];
    },
  });
}

export function useFoodLogMutations(profileId: string | null, date: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["food_logs", profileId, date] });

  const add = useMutation({
    mutationFn: async (log: Partial<FoodLog>) => {
      const { error } = await supabase.from("food_logs").insert(log as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...log }: Partial<FoodLog> & { id: string }) => {
      const { error } = await supabase.from("food_logs").update(log as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { add, update, remove };
}

/* ---------------------------- WEIGHT ---------------------------- */

export function useWeightEntries(profileId: string | null) {
  return useQuery({
    queryKey: ["weight", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("profile_id", profileId!)
        .order("entry_date");
      if (error) throw error;
      return data as unknown as WeightEntry[];
    },
  });
}

export function useWeightMutations(profileId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["weight", profileId] });
  const upsert = useMutation({
    mutationFn: async ({ entry_date, weight }: { entry_date: string; weight: number }) => {
      const { error } = await supabase
        .from("weight_entries")
        .upsert({ profile_id: profileId!, entry_date, weight } as never, {
          onConflict: "profile_id,entry_date",
        });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { upsert, remove };
}

/* ------------------------ NUTRIENT GOALS ------------------------ */

export function useNutrientGoals(profileId: string | null) {
  return useQuery({
    queryKey: ["nutrient_goals", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrient_goals")
        .select("*")
        .eq("profile_id", profileId!);
      if (error) throw error;
      return data as unknown as NutrientGoal[];
    },
  });
}

export function useNutrientGoalMutations(profileId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["nutrient_goals", profileId] });
  const upsert = useMutation({
    mutationFn: async (rows: { nutrient_key: string; rda: number | null; upper_limit: number | null }[]) => {
      const payload = rows.map((r) => ({ ...r, profile_id: profileId! }));
      const { error } = await supabase
        .from("nutrient_goals")
        .upsert(payload as never, { onConflict: "profile_id,nutrient_key" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { upsert };
}

/* ------------------------- DAILY REVIEW ------------------------- */

export function useDailyReview(profileId: string | null, date: string) {
  return useQuery({
    queryKey: ["review", profileId, date],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reviews")
        .select("*")
        .eq("profile_id", profileId!)
        .eq("review_date", date)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DailyReview | null;
    },
  });
}

export function useReviewMutations(profileId: string | null, date: string) {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: async (review: Partial<DailyReview>) => {
      const { error } = await supabase
        .from("daily_reviews")
        .upsert({ ...review, profile_id: profileId!, review_date: date } as never, {
          onConflict: "profile_id,review_date",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review", profileId, date] });
    },
  });
  return { upsert };
}
