import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { computeMacros, ACTIVITY_LEVELS } from "@/lib/calculator";

type Sex = "male" | "female";

type Props = {
  open: boolean;
  profileId: string | null;
  profileName: string;
  onComplete: (profileId: string) => void;
};

const STEPS = ["Age", "Gender", "Height", "Weight", "Activity", "Goal"] as const;

type Goal = "lose" | "gain" | "maintain";
const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: "lose", label: "Weight Loss", desc: "Calorie deficit to lose fat", emoji: "🔥" },
  { value: "gain", label: "Muscle Gain", desc: "Calorie surplus to build muscle", emoji: "💪" },
  { value: "maintain", label: "Maintenance", desc: "Maintain current weight", emoji: "⚖️" },
];

export function OnboardingWizard({ open, profileId, profileName, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 0) return Number(age) > 0 && Number(age) < 120;
    if (step === 2) return Number(height) > 50 && Number(height) < 260;
    if (step === 3) return Number(weight) > 20 && Number(weight) < 400;
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!profileId) return;
    setSaving(true);
    const weightNum = Number(weight);
    const macros = computeMacros("mifflin", {
      sex,
      age: Number(age),
      height_cm: Number(height),
      weight_kg: weightNum,
      body_fat_pct: null,
      activity_level: activity,
      goal,
      protein_per_kg: 2,
      fat_pct: 25,
      calorie_adjust: 500,
    });

    const update: Record<string, unknown> = {
      age: Number(age),
      sex,
      height_cm: Number(height),
      current_weight: weightNum,
      activity_level: activity,
      diet_goal: goal,
      calc_formula: "mifflin",
      protein_per_kg: 2,
      fat_pct: 25,
      calorie_adjust: 500,
    };
    if (macros) {
      update.calorie_target = macros.calories;
      update.protein_target = macros.protein;
      update.carb_target = macros.carbs;
      update.fat_target = macros.fat;
    }

    const { error } = await supabase
      .from("profiles")
      .update(update as never)
      .eq("id", profileId);

    if (error) {
      toast.error("Could not save your details");
      setSaving(false);
      return;
    }

    // Log initial weigh-in so trends work from day one.
    await supabase.from("weight_entries").insert({
      profile_id: profileId,
      weight: weightNum,
      date: new Date().toISOString().slice(0, 10),
    } as never);

    toast.success(`All set, ${profileName}! Let's start tracking 🎉`);
    setSaving(false);
    onComplete(profileId);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome, {profileName}! 👋</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "gradient-hero" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[180px] pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {step === 0 && (
                <Field label="How old are you?">
                  <input
                    autoFocus
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">years</p>
                </Field>
              )}

              {step === 1 && (
                <Field label="What's your gender?">
                  <div className="grid grid-cols-2 gap-2">
                    {(["male", "female"] as Sex[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSex(s)}
                        className={`press rounded-xl border py-3 text-sm font-semibold capitalize ${
                          sex === s
                            ? "gradient-hero text-primary-foreground border-transparent"
                            : "bg-card"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {step === 2 && (
                <Field label="Your height">
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">cm</p>
                </Field>
              )}

              {step === 3 && (
                <Field label="Your current weight">
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">kg</p>
                </Field>
              )}

              {step === 4 && (
                <Field label="How active are you?">
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setActivity(a.value)}
                        className={`press flex w-full items-start justify-between gap-2 rounded-xl border p-3 text-left ${
                          activity === a.value
                            ? "border-primary bg-primary/5"
                            : "bg-card"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{a.label}</p>
                          <p className="text-xs text-muted-foreground">{a.desc}</p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          ×{a.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {step === 5 && (
                <Field label="What's your primary goal?">
                  <div className="space-y-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className={`press flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                          goal === g.value
                            ? "border-primary bg-primary/5"
                            : "bg-card"
                        }`}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{g.label}</p>
                          <p className="text-xs text-muted-foreground">{g.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={back}
            disabled={step === 0 || saving}
            className="press flex items-center gap-1 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canNext() || saving}
            className="press flex flex-1 items-center justify-center gap-2 rounded-xl gradient-hero py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <>
                <Sparkles className="h-4 w-4" /> Finish
              </>
            ) : (
              <>
                Next <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
