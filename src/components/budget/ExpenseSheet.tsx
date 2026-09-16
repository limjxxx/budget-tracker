import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, Expense } from "@/lib/budget-data";
import { money } from "@/lib/money";
import { todayDateString } from "@/lib/month";

export function ExpenseSheet({
  open,
  onOpenChange,
  categories,
  expenses,
  onAdd,
  onDelete,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  expenses: Expense[];
  onAdd: (input: { categoryId: string; amount: number; spentOn: string; note?: string }) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [pickedId, setPickedId] = useState("");
  const categoryId = categories.some((c) => c.id === pickedId) ? pickedId : (categories[0]?.id ?? "");
  const setCategoryId = setPickedId;
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState(todayDateString());
  const [note, setNote] = useState("");

  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!categoryId) {
      toast.error("Add a category first.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount.");
      return;
    }
    onAdd({ categoryId, amount: value, spentOn, note });
    setAmount("");
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl italic tracking-tight">Add a spend</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="label-mono">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label-mono">Amount (S$)</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="6.50"
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 font-mono text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="label-mono">Date</span>
              <input
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 font-mono text-[13px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <label className="block">
            <span className="label-mono">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="matcha latte"
              className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink px-3 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-ink/90 disabled:opacity-60"
          >
            Save expense
          </button>
        </form>

        <div className="mt-2">
          <div className="label-mono">Recent</div>
          <div className="mt-2 divide-y divide-border">
            {expenses.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="cat-name truncate text-[12px] text-ink">{nameOf(e.category_id)}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {e.spent_on}
                    {e.note ? ` · ${e.note}` : ""}
                  </div>
                </div>
                <div className="font-mono text-[13px]">{money(e.amount, { cents: true })}</div>
                <button
                  onClick={() => onDelete(e.id)}
                  className="font-mono text-[10px] text-muted-foreground hover:text-warn"
                >
                  remove
                </button>
              </div>
            ))}
            {expenses.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">Nothing added yet.</p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
