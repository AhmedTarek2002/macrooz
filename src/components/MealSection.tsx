import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "motion/react";
import { Plus, BookmarkPlus } from "lucide-react";
import { FoodLogItem } from "./FoodLogItem";
import { MEAL_META, type Meal } from "@/lib/nutrients";
import { sumLogs, fmt } from "@/lib/nutrition";
import type { FoodLog } from "@/lib/types";

export function MealSection({
  meal,
  logs,
  onAddClick,
  onUpdateGrams,
  onDelete,
  onDuplicate,
  onEdit,
  onSaveTemplate,
}: {
  meal: Meal;
  logs: FoodLog[];
  onAddClick: (meal: Meal) => void;
  onUpdateGrams: (id: string, grams: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (log: FoodLog) => void;
  onEdit: (log: FoodLog) => void;
  onSaveTemplate?: (meal: Meal, logs: FoodLog[]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `meal-${meal}`, data: { meal } });
  const totals = sumLogs(logs);
  const meta = MEAL_META[meal];

  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border bg-card p-3 shadow-card transition-colors ${
        isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h2 className="font-bold">{meta.label}</h2>
          <span className="text-xs text-muted-foreground">{fmt(totals.calories)} kcal</span>
        </div>
        <div className="flex items-center gap-1">
          {onSaveTemplate && logs.length > 0 && (
            <button
              onClick={() => onSaveTemplate(meal, logs)}
              className="press flex h-8 w-8 items-center justify-center rounded-full border bg-card text-muted-foreground"
              aria-label={`Save ${meta.label} as template`}
              title="Save as template"
            >
              <BookmarkPlus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onAddClick(meal)}
            className="press flex h-8 w-8 items-center justify-center rounded-full gradient-hero text-primary-foreground"
            aria-label={`Add to ${meta.label}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>


      <div className={`space-y-1.5 ${isOver ? "min-h-16" : ""}`}>
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FoodLogItem
                log={log}
                onUpdateGrams={onUpdateGrams}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <button
            onClick={() => onAddClick(meal)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-3 text-xs font-medium text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add food
          </button>
        )}
      </div>
    </section>
  );
}
