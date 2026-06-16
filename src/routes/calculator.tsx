import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalculatorSection } from "@/components/CalculatorSection";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Macro Calculator — Macrooz" },
      {
        name: "description",
        content:
          "Calculate your daily calories, protein, carbs and fat using Mifflin-St Jeor, Harris-Benedict or Katch-McArdle.",
      },
    ],
  }),
  component: () => (
    <AppShell title="Calculator" subtitle="Daily calories & macros">
      <CalculatorSection />
    </AppShell>
  ),
});
