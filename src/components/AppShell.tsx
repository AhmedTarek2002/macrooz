import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useProfile } from "@/context/ProfileProvider";
import { ProfileGate } from "./ProfileGate";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

/**
 * Wraps every page: handles client-only mount, profile gate, top bar and bottom nav.
 * Data lives in localStorage / browser supabase client, so render only after mount.
 */
export function AppShell({
  title,
  subtitle,
  children,
  hideNav = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hideNav?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const { currentProfile, loading } = useProfile();

  useEffect(() => setMounted(true), []);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!currentProfile) return <ProfileGate />;

  return (
    <div className="min-h-screen bg-background">
      <TopBar title={title} subtitle={subtitle} />
      <motion.main
        key={title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-md px-4 pb-safe-nav pt-2"
      >
        {children}
      </motion.main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
