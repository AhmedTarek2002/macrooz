import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, Minus, Plus } from "lucide-react";
import { scaleSnapshot, fmt } from "@/lib/nutrition";
import type { FoodLog } from "@/lib/types";

export function FoodLogItem({
  log,
  onUpdateGrams,
  onDelete,
  onDuplicate,
  onEdit,
}: {
  log: FoodLog;
  onUpdateGrams: (id: string, grams: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (log: FoodLog) => void;
  onEdit: (log: FoodLog) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: log.id,
    data: { meal: log.meal },
  });
  const [grams, setGrams] = useState(log.grams);

  useEffect(() => setGrams(log.grams), [log.grams]);

  const commit = (g: number) => {
    const v = Math.max(0, g);
    setGrams(v);
    if (v !== log.grams) onUpdateGrams(log.id, v);
  };

  const s = scaleSnapshot(log.food_snapshot, grams);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`flex items-center gap-2 rounded-xl border bg-card p-2 shadow-card ${
        isDragging ? "z-50 opacity-80 shadow-pop" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        onClick={() => onEdit(log)}
        className="press flex min-w-0 flex-1 items-center gap-2 text-left"
        aria-label="Edit item"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
          {log.food_snapshot.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" dir="auto">{log.food_snapshot.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {fmt(s.calories)} kcal · P{fmt(s.protein)} C{fmt(s.carbs)} F{fmt(s.fat)}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-0.5 rounded-lg bg-muted/70 p-0.5">
        <button onClick={() => commit(grams - 10)} className="press rounded-md p-1">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
          onBlur={() => commit(grams)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-9 bg-transparent text-center text-xs font-bold outline-none"
        />
        <button onClick={() => commit(grams + 10)} className="press rounded-md p-1">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <button onClick={() => onDuplicate(log)} className="press p-1 text-muted-foreground" aria-label="Duplicate">
        <Copy className="h-4 w-4" />
      </button>
      <button onClick={() => onDelete(log.id)} className="press p-1 text-status-over" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
