import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileProvider";
import { ALL_NUTRIENTS } from "@/lib/nutrients";

const COLORS = ["mango", "berry", "ocean", "lime", "grape", "coral"];
const COLOR_GRADIENT: Record<string, string> = {
  mango: "gradient-sunrise",
  berry: "bg-protein",
  ocean: "bg-fat",
  lime: "gradient-fresh",
  grape: "bg-omega",
  coral: "gradient-hero",
};

async function seedNutrientGoals(profileId: string) {
  const rows = ALL_NUTRIENTS.map((n) => ({
    profile_id: profileId,
    nutrient_key: n.key,
    rda: n.defaultRda,
    upper_limit: n.defaultUl,
  }));
  await supabase.from("nutrient_goals").insert(rows as never);
}

export function ProfileGate() {
  const { profiles, setCurrentProfileId, refetchProfiles } = useProfile();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const color = COLORS[profiles.length % COLORS.length];
    const { data, error } = await supabase
      .from("profiles")
      .insert({ name: name.trim(), color } as never)
      .select()
      .single();
    if (error || !data) {
      toast.error("Could not create profile");
      setBusy(false);
      return;
    }
    const id = (data as { id: string }).id;
    await seedNutrientGoals(id);
    await refetchProfiles();
    setCurrentProfileId(id);
    toast.success(`Welcome, ${name.trim()}! 🎉`);
  };

  return (
    <div className="min-h-screen bg-background safe-top px-5 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md pt-12 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl gradient-hero text-3xl shadow-pop">
          🥑
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Macrooz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track meals, macros, micros & more. Pick a profile to start.
        </p>
      </motion.div>

      <div className="mx-auto mt-8 max-w-md space-y-3">
        {profiles.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setCurrentProfileId(p.id)}
            className="press flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-card"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground ${COLOR_GRADIENT[p.color] || "gradient-hero"}`}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.diet_goal} • {p.calorie_target} kcal</p>
            </div>
          </motion.button>
        ))}

        {creating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border bg-card p-4 shadow-card"
          >
            <label className="text-sm font-medium">Profile name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Ahmed"
              className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={busy || !name.trim()}
                className="press flex flex-1 items-center justify-center gap-2 rounded-xl gradient-hero py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="press rounded-xl border px-4 font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 font-semibold text-muted-foreground"
          >
            <Plus className="h-5 w-5" /> New profile
          </button>
        )}
      </div>
    </div>
  );
}
