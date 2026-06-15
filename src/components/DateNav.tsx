import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/nutrition";

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function label(dateStr: string) {
  const t = todayStr();
  if (dateStr === t) return "Today";
  if (dateStr === addDays(t, -1)) return "Yesterday";
  if (dateStr === addDays(t, 1)) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-card p-1.5 shadow-card">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="press flex h-9 w-9 items-center justify-center rounded-xl bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button className="press flex items-center gap-2 px-3 font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            {label(date)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={new Date(date + "T00:00:00")}
            onSelect={(d) => {
              if (d)
                onChange(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                );
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="press flex h-9 w-9 items-center justify-center rounded-xl bg-muted"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
