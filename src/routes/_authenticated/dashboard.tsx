import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  budgetByCategory,
  countByCategory,
  spentByCategory,
  useAddCategory,
  useAddExpense,
  useBudgets,
  useCategories,
  useCopyBudgetsFromPreviousMonth,
  useDeleteCategory,
  useDeleteExpense,
  useExpenses,
  useSeedStarterCategories,
  useSetBudget,
  useUpdateCategory,
  useRecurringItems,
  useAddRecurring,
  useToggleRecurring,
  useDeleteRecurring,
  useRunDueRecurring,
  sortByUsage,
  type CategoryMonth,
} from "@/lib/budget-data";
import { buildInsights, type Insight } from "@/lib/insights";
import { money, pct } from "@/lib/money";
import {
  addMonths,
  currentMonthKey,
  monthKeyOfDateString,
  monthLabel,
  monthProgress,
  recentMonths,
} from "@/lib/month";
import { MonthSwitcher } from "@/components/budget/MonthSwitcher";
import { CategoryLedger } from "@/components/budget/CategoryLedger";
import { ComparePanel } from "@/components/budget/ComparePanel";
import { AdvisoryPanel } from "@/components/budget/AdvisoryPanel";
import { ExpenseSheet } from "@/components/budget/ExpenseSheet";
import { CategoriesSheet } from "@/components/budget/CategoriesSheet";
import { RecurringSheet } from "@/components/budget/RecurringSheet";
import { TabBar } from "@/components/budget/TabBar";
import { DailyLog } from "@/components/budget/DailyLog";

type Tab = "activity" | "summary";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My budget — Nest" },
      {
        name: "description",
        content: "Log every spend day-to-day, then see your month by category with budgets and recommendations.",
      },
      { property: "og:title", content: "My budget — Nest" },
      {
        property: "og:description",
        content: "A daily spending log and a monthly summary by category, with budgets and insights.",
      },
    ],
  }),
  component: Budget,
});

function Budget() {
  const [month, setMonth] = useState(currentMonthKey());
  const [tab, setTab] = useState<Tab>("activity");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const months = useMemo(() => recentMonths(currentMonthKey(), 4), []);
  const compareWindow = useMemo(() => recentMonths(month, 4), [month]);
  const previousMonth = addMonths(month, -1);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const categories = useCategories();
  const budgets = useBudgets();
  const expenses = useExpenses();

  const setBudget = useSetBudget();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const seedCategories = useSeedStarterCategories();
  const copyBudgets = useCopyBudgetsFromPreviousMonth();

  const recurring = useRecurringItems();
  const addRecurring = useAddRecurring();
  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();
  const runDueRecurring = useRunDueRecurring();

  // Adds any repeating payments that are already due, once per visit.
  const ranRecurring = useRef(false);
  const runDue = runDueRecurring.mutate;
  useEffect(() => {
    if (ranRecurring.current) return;
    if (!recurring.data?.length) return;
    ranRecurring.current = true;
    runDue(undefined, {
      onSuccess: (added) => {
        if (added) toast.success(`${added} repeating payment${added > 1 ? "s" : ""} added`);
      },
    });
  }, [recurring.data, runDue]);

  const busy =
    setBudget.isPending ||
    addExpense.isPending ||
    addCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    seedCategories.isPending ||
    copyBudgets.isPending;

  const rows: CategoryMonth[] = useMemo(() => {
    const cats = categories.data ?? [];
    const exps = expenses.data ?? [];
    const buds = budgets.data ?? [];
    const spent = spentByCategory(exps, month);
    const prevSpent = spentByCategory(exps, previousMonth);
    const counts = countByCategory(exps, month);
    const budgetMap = budgetByCategory(buds, month);

    return sortByUsage(cats.filter((c) => !c.archived), exps)
      .map((category) => ({
        category,
        spent: spent.get(category.id) ?? 0,
        budget: budgetMap.get(category.id) ?? 0,
        previousSpent: prevSpent.get(category.id) ?? 0,
        txCount: counts.get(category.id) ?? 0,
        history: compareWindow.map((m) => {
          const monthExps = exps.filter(
            (e) => e.category_id === category.id && monthKeyOfDateString(e.spent_on) === m,
          );
          return {
            month: m,
            spent: monthExps.reduce((sum, e) => sum + e.amount, 0),
            count: monthExps.length,
          };
        }),
      }));
  }, [categories.data, expenses.data, budgets.data, month, previousMonth, compareWindow]);

  const sortedCategories = useMemo(
    () => sortByUsage((categories.data ?? []).filter((c) => !c.archived), expenses.data ?? []),
    [categories.data, expenses.data],
  );

  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0);
  const previousTotal = rows.reduce((sum, r) => sum + r.previousSpent, 0);
  const left = totalBudget - totalSpent;
  const usedPct = pct(totalSpent, totalBudget);
  const overCount = rows.filter((r) => r.budget > 0 && r.spent > r.budget).length;
  const insights = useMemo(() => buildInsights(rows, month), [rows, month]);
  const monthExpenses = useMemo(
    () =>
      (expenses.data ?? [])
        .filter((e) => monthKeyOfDateString(e.spent_on) === month)
        .sort((a, b) => (a.spent_on < b.spent_on ? 1 : a.spent_on > b.spent_on ? -1 : 0)),
    [expenses.data, month],
  );
  const previousBudgets = (budgets.data ?? []).filter((b) => b.month === previousMonth);

  const nameOf = (id: string) =>
    (categories.data ?? []).find((c) => c.id === id)?.name ?? "—";

  const progress = monthProgress(month);
  const pace =
    totalBudget > 0 && progress > 0.1
      ? totalSpent / progress > totalBudget * 1.05
        ? "tracking over pace"
        : "on pace"
      : null;

  function applyInsight(insight: Insight) {
    const action = insight.action;
    if (!action) return;
    if (action.type === "set-budget") {
      setBudget.mutate(
        { categoryId: action.categoryId, month, amount: action.amount },
        { onSuccess: () => toast.success("Budget updated") },
      );
    } else {
      setBudget.mutate(
        { categoryId: action.fromCategoryId, month, amount: action.fromAmount },
        {
          onSuccess: () =>
            setBudget.mutate(
              { categoryId: action.toCategoryId, month, amount: action.toAmount },
              { onSuccess: () => toast.success("Budget moved") },
            ),
        },
      );
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const loading = categories.isLoading || budgets.isLoading || expenses.isLoading;
  const hasCategories = (categories.data ?? []).length > 0;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-ink">
      <div className="pointer-events-none absolute -left-40 -top-32 size-[480px] rounded-full bg-card/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 size-[520px] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[460px] rounded-full bg-card/50 blur-3xl" />

      <div className="relative mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-[13px] font-semibold text-primary-foreground">
              N
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-none">Nest</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CategoriesSheet
              categories={categories.data ?? []}
              busy={busy}
              onAdd={(input) =>
                addCategory.mutate(input, { onSuccess: () => toast.success("Category added") })
              }
              onRename={(input) => updateCategory.mutate(input)}
              onDelete={(id) => deleteCategory.mutate(id)}
            />
            {hasCategories ? (
              <RecurringSheet
                categories={sortedCategories}
                items={recurring.data ?? []}
                busy={busy || addRecurring.isPending}
                onAdd={(input) =>
                  addRecurring.mutate(input, {
                    onSuccess: () => {
                      toast.success("Repeating payment saved");
                      runDueRecurring.mutate(undefined);
                    },
                    onError: (e) =>
                      toast.error(e instanceof Error ? e.message : "Couldn't save that"),
                  })
                }
                onToggle={(input) => toggleRecurring.mutate(input)}
                onDelete={(id) => deleteRecurring.mutate(id)}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setExpenseOpen(true)}
              className="hidden rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent/90 sm:inline-flex"
            >
              Add expense
            </button>
            <button
              onClick={signOut}
              className="hidden rounded-lg px-2.5 py-2 font-mono text-[11px] text-muted-foreground hover:text-ink sm:block"
            >
              sign out
            </button>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between gap-3 overflow-x-auto">
          <MonthSwitcher months={months} value={month} onChange={setMonth} />
          {tab === "summary" && previousBudgets.length && totalBudget === 0 ? (
            <button
              onClick={() =>
                copyBudgets.mutate(
                  { month, previous: previousBudgets },
                  { onSuccess: () => toast.success("Budgets copied") },
                )
              }
              className="shrink-0 rounded-lg bg-card px-3 py-2 text-[12px] font-medium ring-1 ring-border hover:bg-card/70"
            >
              Copy last month's budgets
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="panel p-8 text-[13px] text-muted-foreground">Loading your budget…</div>
        ) : !hasCategories ? (
          <div className="panel rise p-8">
            <h1 className="font-serif text-2xl italic tracking-tight">Start with your categories</h1>
            <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              Add the categories you actually spend on. We can drop in a starter set — food, drinks,
              matcha, BBT, cab, groceries, giving, savings and more — and you can rename or remove
              any of them.
            </p>
            <button
              onClick={() =>
                seedCategories.mutate(undefined, {
                  onSuccess: () => toast.success("Categories added"),
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add them"),
                })
              }
              disabled={busy}
              className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              Add my starter categories
            </button>
          </div>
        ) : (
          <div className={tab === "activity" ? "pb-24" : undefined}>
            {/* month summary strip */}
            <div className="rise panel p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="label-mono">{monthLabel(month, "long")}</div>
                  <div className="mt-1.5 font-mono text-3xl font-medium tracking-tight">
                    {money(totalSpent)}
                    <span className="text-muted-foreground"> / {money(totalBudget)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <div className="label-mono">left</div>
                    <div
                      className={`font-mono text-lg font-medium ${
                        totalBudget === 0
                          ? "text-muted-foreground"
                          : left < 0
                            ? "text-warn"
                            : "text-accent"
                      }`}
                    >
                      {totalBudget ? money(left) : "—"}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="label-mono">used</div>
                    <div className="font-mono text-lg font-medium">
                      {totalBudget ? `${usedPct}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="track mt-4 h-2.5 w-full">
                <div
                  className={`bar-grow h-full rounded-full ${usedPct > 100 ? "bg-warn" : "bg-accent"}`}
                  style={{ width: `${Math.min(100, usedPct)}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                {pace ? <span>{pace}</span> : null}
                <span>{rows.length} categories</span>
                <span>{overCount} over budget</span>
                <span>
                  {previousTotal
                    ? `${totalSpent > previousTotal ? "▲" : "▼"} ${money(Math.abs(totalSpent - previousTotal))} vs prior month`
                    : "no prior month yet"}
                </span>
              </div>
            </div>

            <div className="my-4">
              <TabBar<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "activity", label: "Activity" },
                  { value: "summary", label: "Summary" },
                ]}
              />
            </div>

            {tab === "activity" ? (
              <DailyLog
                expenses={monthExpenses}
                categoryName={nameOf}
                onAdd={() => setExpenseOpen(true)}
                onDelete={(id) =>
                  deleteExpense.mutate(id, {
                    onSuccess: () => toast.success("Removed"),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't remove"),
                  })
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <section className="flex flex-col gap-5 lg:col-span-8">
                  <CategoryLedger
                    rows={rows}
                    month={month}
                    previousMonth={previousMonth}
                    onSetBudget={(categoryId, amount) =>
                      setBudget.mutate(
                        { categoryId, month, amount },
                        {
                          onSuccess: () => toast.success("Budget saved"),
                          onError: (e) =>
                            toast.error(e instanceof Error ? e.message : "Couldn't save that"),
                        },
                      )
                    }
                  />
                </section>
                <aside className="flex flex-col gap-5 lg:col-span-4">
                  <AdvisoryPanel insights={insights} onApply={applyInsight} busy={busy} />
                  <ComparePanel rows={rows} months={compareWindow} />
                  <button
                    onClick={signOut}
                    className="rounded-lg py-2 font-mono text-[11px] text-muted-foreground hover:text-ink sm:hidden"
                  >
                    sign out
                  </button>
                </aside>
              </div>
            )}
          </div>
        )}

        <ExpenseSheet
          open={expenseOpen}
          onOpenChange={setExpenseOpen}
          categories={sortedCategories}
          expenses={monthExpenses}
          busy={busy}
          onAdd={(input) => addExpense.mutate(input, { onSuccess: () => toast.success("Added") })}
          onDelete={(id) => deleteExpense.mutate(id)}
        />

        {tab === "activity" && hasCategories ? (
          <button
            type="button"
            onClick={() => setExpenseOpen(true)}
            aria-label="Add a spend"
            className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light leading-none text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent/90 sm:hidden"
          >
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}
