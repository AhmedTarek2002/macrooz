import { STATUS_LABEL, type Status } from "@/lib/nutrition";

const CLASS: Record<Status, string> = {
  low: "bg-status-low/15 text-status-low",
  almost: "bg-status-almost/20 text-status-almost",
  good: "bg-status-good/15 text-status-good",
  over: "bg-status-over/15 text-status-over",
  none: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  if (status === "none") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASS[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
