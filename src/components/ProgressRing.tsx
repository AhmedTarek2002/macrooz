import { CountUp } from "./CountUp";

/** Animated circular progress ring with a colored stroke. */
export function ProgressRing({
  value,
  target,
  colorVar,
  size = 92,
  stroke = 9,
  label,
  unit = "",
  decimals = 0,
}: {
  value: number;
  target: number;
  colorVar: string; // e.g. "var(--cal)"
  size?: number;
  stroke?: number;
  label: string;
  unit?: string;
  decimals?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const offset = c * (1 - pct);
  const over = target > 0 && value > target * 1.1;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={over ? "var(--status-over)" : colorVar}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CountUp
            value={value}
            decimals={decimals}
            className="text-lg font-bold leading-none tabular-nums"
          />
          <span className="text-[10px] text-muted-foreground">/ {Math.round(target)}{unit}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
