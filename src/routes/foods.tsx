import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, Download } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AppShell } from "@/components/AppShell";
import { useFoods, useFoodMutations } from "@/hooks/useData";
import { FOOD_CATEGORIES, VITAMINS, MINERALS } from "@/lib/nutrients";
import { fmt } from "@/lib/nutrition";
import type { Food, Micros } from "@/lib/types";

export const Route = createFileRoute("/foods")({
  head: () => ({ meta: [{ title: "Food Database — Macrooz" }] }),
  component: () => (
    <AppShell title="Food Database" subtitle="Per 100g values">
      <FoodsPage />
    </AppShell>
  ),
});

const EMOJIS = ["🍽️","🍗","🥚","🍚","🌾","🍌","🍎","🥑","🐟","🥛","🌰","🥦","🥬","🍠","🥔","🫘","🫒","🥩","🍞","🧀","🍊","🥒","🍅","🥜","🍓","🥕","�qi"];

function FoodsPage() {
  const { data: foods = [] } = useFoods();
  const { create, update, remove } = useFoodMutations();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState<Food | "new" | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => (cat === "All" || f.category === cat) && (!q || f.name.toLowerCase().includes(q)));
  }, [foods, query, cat]);

  const exportCsv = () => {
    const keys = [...VITAMINS, ...MINERALS].map((n) => n.key);
    const header = ["name", "category", "calories", "protein", "carbs", "fat", "fiber", "omega3", ...keys];
    const rows = foods.map((f) =>
      [f.name, f.category, f.calories, f.protein, f.carbs, f.fat, f.fiber, f.omega3, ...keys.map((k) => f.micros?.[k] ?? "")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "macrooz-foods.csv";
    a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods…"
            dir="auto"
            className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button onClick={exportCsv} className="press flex items-center justify-center rounded-xl border bg-card px-3" aria-label="Export CSV">
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {["All", ...FOOD_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`press whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
              cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-xl border bg-card p-2.5 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">{f.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" dir="auto">{f.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {fmt(f.calories)} kcal · P{fmt(f.protein)} C{fmt(f.carbs)} F{fmt(f.fat)}
              </p>
            </div>
            <button onClick={() => setEditing(f)} className="press p-1.5 text-muted-foreground"><Pencil className="h-4 w-4" /></button>
            <button
              onClick={() => { if (confirm(`Delete ${f.name}?`)) remove.mutate(f.id, { onSuccess: () => toast.success("Deleted") }); }}
              className="press p-1.5 text-status-over"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No foods found.</p>}
      </div>

      <button
        onClick={() => setEditing("new")}
        className="press fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full gradient-hero px-5 py-3 font-bold text-primary-foreground shadow-pop"
      >
        <Plus className="h-5 w-5" /> Add food
      </button>

      {editing && (
        <FoodForm
          food={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            if (editing === "new") create.mutate(payload, { onSuccess: () => { toast.success("Food added"); setEditing(null); } });
            else update.mutate({ id: editing.id, ...payload }, { onSuccess: () => { toast.success("Food updated"); setEditing(null); } });
          }}
        />
      )}
    </div>
  );
}

function FoodForm({ food, onClose, onSave }: { food: Food | null; onClose: () => void; onSave: (f: Partial<Food>) => void }) {
  const [f, setF] = useState({
    name: food?.name ?? "",
    category: food?.category ?? "Other",
    icon: food?.icon ?? "🍽️",
    calories: String(food?.calories ?? ""),
    protein: String(food?.protein ?? ""),
    carbs: String(food?.carbs ?? ""),
    fat: String(food?.fat ?? ""),
    fiber: String(food?.fiber ?? ""),
    omega3: String(food?.omega3 ?? ""),
  });
  const [micros, setMicros] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    [...VITAMINS, ...MINERALS].forEach((n) => (m[n.key] = food?.micros?.[n.key] != null ? String(food.micros[n.key]) : ""));
    return m;
  });

  const submit = () => {
    if (!f.name.trim()) return toast.error("Name is required");
    const microsOut: Micros = {};
    for (const [k, v] of Object.entries(micros)) if (v !== "") microsOut[k] = Number(v);
    onSave({
      name: f.name.trim(),
      category: f.category,
      icon: f.icon,
      calories: Number(f.calories) || 0,
      protein: Number(f.protein) || 0,
      carbs: Number(f.carbs) || 0,
      fat: Number(f.fat) || 0,
      fiber: Number(f.fiber) || 0,
      omega3: Number(f.omega3) || 0,
      micros: microsOut,
    });
  };

  const num = (label: string, key: keyof typeof f, suffix = "g") => (
    <label className="block">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <input
          type="number"
          value={f[key]}
          onChange={(e) => setF((s) => ({ ...s, [key]: e.target.value }))}
          className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{food ? "Edit food" : "Add food"}</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-8">
          <label className="block">
            <span className="text-[11px] font-medium text-muted-foreground">Name (keep original language)</span>
            <input
              value={f.name}
              onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
              dir="auto"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-muted-foreground">Category</span>
              <select
                value={f.category}
                onChange={(e) => setF((s) => ({ ...s, category: e.target.value }))}
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              >
                {FOOD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-muted-foreground">Icon</span>
              <select
                value={f.icon}
                onChange={(e) => setF((s) => ({ ...s, icon: e.target.value }))}
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-lg outline-none focus:ring-2 focus:ring-ring"
              >
                {EMOJIS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">Macros (per 100g)</p>
            <div className="grid grid-cols-3 gap-2">
              {num("Calories", "calories", "kcal")}
              {num("Protein", "protein")}
              {num("Carbs", "carbs")}
              {num("Fat", "fat")}
              {num("Fiber", "fiber")}
              {num("Omega-3", "omega3")}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">Vitamins (per 100g)</p>
            <div className="grid grid-cols-3 gap-2">
              {VITAMINS.map((n) => (
                <MicroInput key={n.key} label={n.label} unit={n.unit} value={micros[n.key]} onChange={(v) => setMicros((s) => ({ ...s, [n.key]: v }))} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Minerals (per 100g)</p>
            <div className="grid grid-cols-3 gap-2">
              {MINERALS.map((n) => (
                <MicroInput key={n.key} label={n.label} unit={n.unit} value={micros[n.key]} onChange={(v) => setMicros((s) => ({ ...s, [n.key]: v }))} />
              ))}
            </div>
          </div>

          <button onClick={submit} className="press w-full rounded-xl gradient-hero py-3.5 font-bold text-primary-foreground">
            {food ? "Save changes" : "Add food"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MicroInput({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block truncate text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="relative mt-0.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}
