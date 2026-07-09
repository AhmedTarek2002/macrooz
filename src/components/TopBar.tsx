import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Moon, Sun, ChevronDown, UserCog, LogOut, Check, Users } from "lucide-react";
import { useProfile } from "@/context/ProfileProvider";
import { ManageProfiles } from "@/components/ManageProfiles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLOR_GRADIENT: Record<string, string> = {
  mango: "gradient-sunrise",
  berry: "bg-protein",
  ocean: "bg-fat",
  lime: "gradient-fresh",
  grape: "bg-omega",
  coral: "gradient-hero",
};

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { profiles, currentProfile, setCurrentProfileId, theme, toggleTheme } = useProfile();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl safe-top px-4 pb-2">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="press flex h-9 w-9 items-center justify-center rounded-full border bg-card"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="press flex items-center gap-1 rounded-full border bg-card py-1 pl-1 pr-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ${COLOR_GRADIENT[currentProfile?.color || "mango"]}`}
                >
                  {currentProfile?.name.charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch profile</DropdownMenuLabel>
              {profiles.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setCurrentProfileId(p.id)}>
                  <span
                    className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground ${COLOR_GRADIENT[p.color]}`}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.id === currentProfile?.id && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserCog className="mr-2 h-4 w-4" /> Profile &amp; Goals
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentProfileId(null)}>
                <LogOut className="mr-2 h-4 w-4" /> Choose profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
