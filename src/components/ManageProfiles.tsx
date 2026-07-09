import { useState } from "react";
import { Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/types";

const COLOR_GRADIENT: Record<string, string> = {
  mango: "gradient-sunrise",
  berry: "bg-protein",
  ocean: "bg-fat",
  lime: "gradient-fresh",
  grape: "bg-omega",
  coral: "gradient-hero",
};

/**
 * Deletes a profile and all of its associated data (logs, weights, goals, reviews).
 */
async function deleteProfileData(profileId: string) {
  await Promise.all([
    supabase.from("food_logs").delete().eq("profile_id", profileId),
    supabase.from("weight_entries").delete().eq("profile_id", profileId),
    supabase.from("nutrient_goals").delete().eq("profile_id", profileId),
    supabase.from("daily_reviews").delete().eq("profile_id", profileId),
  ]);
  await supabase.from("profiles").delete().eq("id", profileId);
}

export function ManageProfiles({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profiles, currentProfileId, setCurrentProfileId, refetchProfiles } = useProfile();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (p: Profile) => {
    const isLast = profiles.length <= 1;
    const message = isLast
      ? `Delete "${p.name}"? This is your only profile — all profile data will be cleared and you'll return to the welcome screen.`
      : `Delete "${p.name}" and all its data? This cannot be undone.`;
    if (!confirm(message)) return;

    setBusyId(p.id);
    await deleteProfileData(p.id);

    if (isLast) {
      // Last profile removed — clear selection and drop back to onboarding.
      setCurrentProfileId(null);
      await refetchProfiles();
      setBusyId(null);
      onOpenChange(false);
      toast.success("All profile data cleared");
      return;
    }

    // Deleted one of several — reselect another if the active one was removed.
    if (p.id === currentProfileId) {
      const next = profiles.find((x) => x.id !== p.id);
      setCurrentProfileId(next ? next.id : null);
    }
    await refetchProfiles();
    setBusyId(null);
    toast.success("Profile deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Manage Profiles
          </DialogTitle>
          <DialogDescription>
            Remove profiles you no longer need. Deleting a profile permanently erases all of its
            data.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground ${COLOR_GRADIENT[p.color] || "gradient-hero"}`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {p.diet_goal} • {p.calorie_target} kcal
                </p>
              </div>
              <button
                onClick={() => handleDelete(p)}
                disabled={busyId === p.id}
                aria-label={`Delete ${p.name}`}
                className="press flex h-9 w-9 items-center justify-center rounded-xl border border-status-over/40 text-status-over disabled:opacity-50"
              >
                {busyId === p.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
