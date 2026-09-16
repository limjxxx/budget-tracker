import { monthLabel, type MonthKey } from "@/lib/month";

export function MonthSwitcher({
  months,
  value,
  onChange,
}: {
  months: MonthKey[];
  value: MonthKey;
  onChange: (key: MonthKey) => void;
}) {
  return (
    <div className="panel flex items-center gap-1 p-1">
      {months.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-lg px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
            m === value
              ? "bg-ink font-medium text-primary-foreground"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          {monthLabel(m)}
        </button>
      ))}
    </div>
  );
}
