import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  monthlyCost,
  type Category,
  type RecurringFrequency,
  type RecurringItem,
} from "@/lib/budget-data";
import { money } from "@/lib/money";

export function RecurringSheet({
  categories,
  items,
  onAdd,
  onToggle,
  onDelete,
  busy,
}: {
  categories: Category[];
  items: RecurringItem[];
  onAdd: (input: {
    categoryId: string;
    name: string;
    amount: number;
    frequency: RecurringFrequency;
    dayOfMonth: number;
  }) => void;
  onToggle: (input: { id: string; active: boolean }) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [day, setDay] = useState("1");
  const [pickedId, setPickedId] = useState("");

  const categoryId = categories.some((c) => c.id === pickedId)
    ? pickedId
    : (categories[0]?.id ?? "");
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    const dayValue = Number(day);
    if (!categoryId) {
      toast.error("Add a category first.");
      return;
    }
    if (!name.trim()) {
      toast.error("Give it a name, like Phone bill.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount.");
      return;
    }
    if (!Number.isInteger(dayValue) || dayValue < 1 || dayValue > 28) {
      toast.error("Pick a day between 1 and 28.");
      return;
    }
    onAdd({ categoryId, name, amount: value, frequency, dayOfMonth: dayValue });
    setName("");
    setAmount("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-lg bg-card px-3 py-2 text-[13px] font-medium ring-1 ring-border hover:bg-card/70">
          Repeating
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl italic tracking-tight">
            Repeating payments
          </DialogTitle>
        </DialogHeader>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Things like your phone bill or taxes. Nest adds them for you each month on the day you
          choose. A yearly amount is split into twelve, so you set a little aside every month.
        </p>

        <form onSubmit={submit} className="mt-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label-mono">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Phone bill"
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="label-mono">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setPickedId(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="label-mono">Amount (S$)</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45"
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 font-mono text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="label-mono">How often</span>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 text-[13px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              >
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </label>
            <label className="block">
              <span className="label-mono">Day</span>
              <input
                inputMode="numeric"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-card px-3 py-2.5 font-mono text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink px-3 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-ink/90 disabled:opacity-60"
          >
            Save repeating payment
          </button>
        </form>

        <div className="mt-2 divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="cat-name truncate text-[12px] text-ink">{item.name}</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {nameOf(item.category_id)} · day {item.day_of_month} ·{" "}
                  {item.frequency === "yearly"
                    ? `${money(item.amount, { cents: true })} a year`
                    : "every month"}
                  {item.active ? "" : " · paused"}
                </div>
              </div>
              <div className="font-mono text-[13px]">
                {money(monthlyCost(item), { cents: true })}
              </div>
              <button
                onClick={() => onToggle({ id: item.id, active: !item.active })}
                className="font-mono text-[10px] text-muted-foreground hover:text-ink"
              >
                {item.active ? "pause" : "resume"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Stop repeating ${item.name}?`)) onDelete(item.id);
                }}
                className="font-mono text-[10px] text-muted-foreground hover:text-warn"
              >
                delete
              </button>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="py-2 text-[13px] text-muted-foreground">
              Nothing repeating yet.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
