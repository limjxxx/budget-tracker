import { useState } from "react";
import type { CategoryMonth } from "@/lib/budget-data";
import { money, signedMoney } from "@/lib/money";
import { monthLabel, type MonthKey } from "@/lib/month";

function tone(row: CategoryMonth) {
  if (row.budget > 0 && row.spent > row.budget) return "bg-warn";
  if (/savings|give|offering/i.test(row.category.name)) return "bg-accent";
  return "bg-ink/70";
}

function BudgetCell({
  row,
  onSave,
}: {
  row: CategoryMonth;
  onSave: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(row.budget || ""));

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const amount = Number(value);
          if (Number.isFinite(amount) && amount >= 0) onSave(amount);
          setEditing(false);
        }}
        className="flex items-center justify-end gap-1"
      >
        <span className="font-mono text-[11px] text-muted-foreground">S$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => {
            const amount = Number(e.target.value);
            if (Number.isFinite(amount) && amount >= 0) onSave(amount);
            setEditing(false);
          }}
          className="w-16 rounded-md bg-card px-1.5 py-1 text-right font-mono text-[13px] outline-none ring-1 ring-ring"
        />
      </form>
    );
  }

  return (
    <button
      onClick={() => {
        setValue(String(row.budget || ""));
        setEditing(true);
      }}
      title="Edit this budget"
      className="w-full rounded-md py-1 text-right font-mono text-[13px] text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-ink"
    >
      {row.budget ? money(row.budget) : "set"}
    </button>
  );
}

export function CategoryLedger({
  rows,
  month,
  previousMonth,
  onSetBudget,
}: {
  rows: CategoryMonth[];
  month: MonthKey;
  previousMonth: MonthKey;
  onSetBudget: (categoryId: string, amount: number) => void;
}) {
  return (
    <div className="rise panel p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-2">
        <div className="label-mono">By category · {monthLabel(month)}</div>
        <div className="label-mono">tap a budget to edit</div>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row, i) => {
          const delta = row.spent - row.previousSpent;
          const width = row.budget ? Math.min(100, (row.spent / row.budget) * 100) : 0;
          return (
            <div
              key={row.category.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:flex sm:gap-3 sm:py-2.5"
            >
              <div className="min-w-0 sm:w-28">
                <div className="cat-name truncate text-[12px] text-ink">{row.category.name}</div>
              </div>

              <div className="order-3 col-span-2 sm:order-none sm:col-auto sm:flex-1">
                <div className="track h-1.5">
                  <div
                    className={`bar-grow h-full rounded-full ${tone(row)}`}
                    style={{ width: `${width}%`, animationDelay: `${i * 40}ms` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 sm:gap-3">
                <div className="w-16 text-right font-mono text-[13px]">{money(row.spent)}</div>
                <div className="w-16 shrink-0">
                  <BudgetCell row={row} onSave={(amount) => onSetBudget(row.category.id, amount)} />
                </div>
                <div
                  className={`hidden w-16 text-right font-mono text-[12px] font-medium sm:block ${
                    delta > 0 ? "text-warn" : delta < 0 ? "text-good" : "text-muted-foreground"
                  }`}
                  title={`vs ${monthLabel(previousMonth)}`}
                >
                  {row.previousSpent || row.spent ? signedMoney(delta) : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[11px] text-muted-foreground">
        <span>{rows.length} categories</span>
        <span className="font-mono">right column = change vs {monthLabel(previousMonth)}</span>
      </div>
    </div>
  );
}
