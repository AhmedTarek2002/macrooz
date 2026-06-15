import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CalendarDays, Calculator, LineChart, ClipboardCheck, BarChart3, Database } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Today", icon: CalendarDays },
  { to: "/calculator", label: "Calc", icon: Calculator },
  { to: "/weight", label: "Weight", icon: LineChart },
  { to: "/review", label: "Review", icon: ClipboardCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/foods", label: "Foods", icon: Database },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="press relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
            >
              {active && (
                <motion.span
                  layoutId="navpill"
                  className="absolute -top-0 h-1 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
