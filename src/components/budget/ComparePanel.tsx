import type { CategoryMonth } from "@/lib/budget-data";
import { money } from "@/lib/money";
import { monthLabel, type MonthKey } from "@/lib/month";

export function ComparePanel({ rows, months }: { rows: CategoryMonth[]; months: MonthKey[] }) {
  const top = [...rows]
    .filter((r) => r.spent > 0 || r.previousSpent > 0)
    .sort((a, b) => Math.abs(b.spent - b.previousSpent) - Math.abs(a.spent - a.previousSpent))
    .slice(0, 5);

  if (!top.length) {
    return (
      <div className="rise panel p-5">
        <div className="label-mono">Compare</div>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Once you've tracked a couple of months, this shows how each category changed.
        </p>
      </div>
    );
  }

  const peak = Math.max(...top.flatMap((r) => r.history.map((h) => h.spent)), 1);

  return (
    <div className="rise panel p-5">
      <div className="flex items-center justify-between">
        <div className="label-mono">Compare</div>
        <div className="font-mono text-[10px] text-muted-foreground">last {months.length} months</div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {top.map((r) => {
          const delta = r.spent - r.previousSpent;
          return (
            <div key={r.category.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="cat-name truncate text-[12px] text-ink">{r.category.name}</span>
                <span
                  className={`font-mono text-[10px] ${
                    delta > 0 ? "text-warn" : delta < 0 ? "text-good" : "text-muted-foreground"
                  }`}
                >
                  {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}
                  {money(Math.abs(delta))}
                </span>
              </div>
              <div className="mt-2 flex h-14 items-end gap-1.5">
                {r.history.map((h, i) => (
                  <div key={h.month} className="flex-1" title={`${monthLabel(h.month)} · ${money(h.spent)}`}>
                    <div
                      className={`rounded-t ${
                        i === r.history.length - 1
                          ? delta > 0
                            ? "bg-warn"
                            : "bg-accent"
                          : "bg-ink/25"
                      }`}
                      style={{ height: `${Math.max(2, (h.spent / peak) * 56)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1.5 font-mono text-[9px] text-muted-foreground">
                {r.history.map((h) => (
                  <span key={h.month} className="flex-1 text-center">
                    {monthLabel(h.month).slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 font-mono text-[10px] text-muted-foreground">
        monthly totals · change vs last month on the right
      </div>
    </div>
  );
}
