import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/types";

const STORAGE_KEY = "macrooz.currentProfileId";

type ProfileCtx = {
  profiles: Profile[];
  loading: boolean;
  currentProfile: Profile | null;
  currentProfileId: string | null;
  setCurrentProfileId: (id: string | null) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  refetchProfiles: () => void;
};

const Ctx = createContext<ProfileCtx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [currentProfileId, setIdState] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // Restore selected profile from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setIdState(saved);
  }, []);

  const setCurrentProfileId = (id: string | null) => {
    setIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId) ?? null,
    [profiles, currentProfileId],
  );

  // Apply theme from current profile, fall back to localStorage.
  useEffect(() => {
    const fromProfile = currentProfile?.theme as "light" | "dark" | undefined;
    const fromStorage = (localStorage.getItem("macrooz.theme") as "light" | "dark") || "light";
    setTheme(fromProfile ?? fromStorage);
  }, [currentProfile]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("macrooz.theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (currentProfile) {
      supabase
        .from("profiles")
        .update({ theme: next })
        .eq("id", currentProfile.id)
        .then(() => queryClient.invalidateQueries({ queryKey: ["profiles"] }));
    }
  };

  const value: ProfileCtx = {
    profiles,
    loading: isLoading,
    currentProfile,
    currentProfileId,
    setCurrentProfileId,
    theme,
    toggleTheme,
    refetchProfiles: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
