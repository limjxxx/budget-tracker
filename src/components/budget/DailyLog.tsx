import { useMemo } from "react";
import type { Expense } from "@/lib/budget-data";
import { money } from "@/lib/money";

const DOW = new Intl.DateTimeFormat("en-SG", { weekday: "short" });
const DAY = new Intl.DateTimeFormat("en-SG", { day: "2-digit" });
const MON = new Intl.DateTimeFormat("en-SG", { month: "short" });

function parseDate(s: string) {
  const parts = s.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

export function DailyLog({
  expenses,
  categoryName,
  onDelete,
  onAdd,
}: {
  expenses: Expense[];
  categoryName: (id: string) => string;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const arr = map.get(e.spent_on) ?? [];
      arr.push(e);
      map.set(e.spent_on, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="rise panel flex flex-col items-center gap-3 p-10 text-center">
        <h2 className="font-serif text-xl italic tracking-tight">Nothing added this month</h2>
        <p className="max-w-[40ch] text-[13px] leading-relaxed text-muted-foreground">
          Tap the + button to log your first spend — coffee, cab fare, groceries, anything.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent/90"
        >
          Add a spend
        </button>
      </div>
    );
  }

  return (
    <div className="rise panel divide-y divide-border overflow-hidden">
      {groups.map(([date, items]) => {
        const d = parseDate(date);
        const total = items.reduce((s, e) => s + e.amount, 0);
        return (
          <div key={date}>
            <div className="flex items-center justify-between bg-card/40 px-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[15px] font-semibold text-ink">{DAY.format(d)}</span>
                <span className="label-mono">
                  {DOW.format(d)} · {MON.format(d)}
                </span>
              </div>
              <div className="font-mono text-[12px] text-muted-foreground">−{money(total, { cents: true })}</div>
            </div>
            <div className="divide-y divide-border">
              {items.map((e) => (
                <div key={e.id} className="group flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="cat-name truncate text-[12px] text-ink">
                      {categoryName(e.category_id)}
                    </div>
                    {e.note ? (
                      <div className="truncate text-[12px] text-muted-foreground">{e.note}</div>
                    ) : null}
                  </div>
                  <div className="font-mono text-[13px] tabular-nums">{money(e.amount, { cents: true })}</div>
                  <button
                    type="button"
                    onClick={() => onDelete(e.id)}
                    className="font-mono text-[10px] text-muted-foreground hover:text-warn"
                    aria-label="Delete this spend"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
