import type { CategoryMonth } from "@/lib/budget-data";
import { money } from "@/lib/money";
import { monthLabel, monthProgress, type MonthKey } from "@/lib/month";

export type Insight = {
  id: string;
  kind: "overspend" | "rebalance" | "saving" | "trend" | "ontrack";
  tag: string;
  body: string;
  /** Optional one-click budget change. */
  action?:
    | { type: "set-budget"; categoryId: string; amount: number; label: string }
    | {
        type: "move-budget";
        fromCategoryId: string;
        toCategoryId: string;
        amount: number;
        fromAmount: number;
        toAmount: number;
        label: string;
      };
};

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export function buildInsights(rows: CategoryMonth[], month: MonthKey): Insight[] {
  const insights: Insight[] = [];
  const progress = Math.max(0.15, monthProgress(month));
  const withBudget = rows.filter((r) => r.budget > 0);

  // 1. Over cap and pace warnings.
  const over = withBudget
    .filter((r) => r.spent > r.budget)
    .sort((a, b) => b.spent - b.budget - (a.spent - a.budget));
  for (const r of over.slice(0, 2)) {
    insights.push({
      id: `over-${r.category.id}`,
      kind: "overspend",
      tag: "Over budget",
      body: `${r.category.name} is ${money(r.spent - r.budget)} past its ${money(r.budget)} budget.`,
    });
  }

  const pacing = withBudget
    .filter((r) => r.spent <= r.budget && r.spent / progress > r.budget * 1.1)
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget);
  for (const r of pacing.slice(0, 2)) {
    const projected = round5(r.spent / progress);
    insights.push({
      id: `pace-${r.category.id}`,
      kind: "overspend",
      tag: "Trending over",
      body: `${r.category.name} is on pace for about ${money(projected)} this month against a ${money(r.budget)} budget.`,
    });
  }

  // 2. Rebalancing: move money from an under-used category to one that's over budget.
  const strained = [...over, ...pacing][0];
  if (strained) {
    const donor = withBudget
      .filter((r) => r.category.id !== strained.category.id)
      .map((r) => ({ row: r, headroom: r.budget * Math.min(1, progress) - r.spent }))
      .filter((d) => d.headroom > 20 && !/savings|give|offering/i.test(d.row.category.name))
      .sort((a, b) => b.headroom - a.headroom)[0];
    if (donor) {
      const need = Math.max(
        strained.spent - strained.budget,
        strained.spent / progress - strained.budget,
      );
      const amount = round5(Math.min(donor.headroom * 0.6, need));
      insights.push({
        id: `rebalance-${strained.category.id}`,
        kind: "rebalance",
        tag: "Rebalance",
        body: `${donor.row.category.name} has ${money(donor.headroom)} unused. Move ${money(amount)} of its budget to ${strained.category.name}.`,
        action: {
          type: "move-budget",
          fromCategoryId: donor.row.category.id,
          toCategoryId: strained.category.id,
          amount,
          fromAmount: Math.max(0, donor.row.budget - amount),
          toAmount: strained.budget + amount,
          label: `Move ${money(amount)}`,
        },
      });
    }
  }

  // 3. Savings opportunities: frequent small treats that add up to a real amount.
  //    Only discretionary categories (things you could genuinely skip) qualify —
  //    essentials like food or groceries get flagged for overspend elsewhere, not
  //    nagged to "cut down" just because they have several purchases a month.
  const DISCRETIONARY = /matcha|bbt|bubble|cab|taxi|ride|drink|snack|treat|coffee|personal|snacks|dessert|takeaway|takeout/i;
  const isDiscretionary = (name: string) => DISCRETIONARY.test(name);
  const totalSpentForShare = rows.reduce((sum, r) => sum + r.spent, 0);
  const treats = rows
    .filter(
      (r) =>
        isDiscretionary(r.category.name) &&
        r.txCount >= 4 &&
        r.spent >= 40 &&
        r.spent / r.txCount <= 25 &&
        (totalSpentForShare === 0 || r.spent / totalSpentForShare >= 0.05),
    )
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 2);
  for (const r of treats) {
    const trim = round5(r.spent * 0.25);
    if (trim < 10) continue;
    const insight: Insight = {
      id: `save-${r.category.id}`,
      kind: "saving",
      tag: "Savings opportunity",
      body: `${r.category.name}: ${r.txCount} small buys averaging ${money(Math.round(r.spent / r.txCount))}. Skipping about a quarter of them frees ${money(trim)} a month.`,
    };
    if (r.budget) {
      insight.action = {
        type: "set-budget",
        categoryId: r.category.id,
        amount: Math.max(0, r.budget - trim),
        label: `Trim budget by ${money(trim)}`,
      };
    }
    insights.push(insight);
  }

  const treatTotal = treats.reduce((sum, r) => sum + r.spent, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  if (treats.length >= 2 && totalSpent > 0) {
    insights.push({
      id: "treat-share",
      kind: "saving",
      tag: "Biggest driver",
      body: `${treats.map((t) => t.category.name).join(" + ")} is ${Math.round((treatTotal / totalSpent) * 100)}% of your spending this month (${money(treatTotal)}).`,
    });
  }

  // 4. Trends: three consecutive rises.
  for (const r of rows) {
    const h = r.history.slice(-3);
    if (h.length === 3 && h[0]!.spent > 0 && h[1]!.spent > h[0]!.spent && h[2]!.spent > h[1]!.spent) {
      insights.push({
        id: `trend-${r.category.id}`,
        kind: "trend",
        tag: "Creeping up",
        body: `${r.category.name} has risen three months running: ${money(h[0]!.spent)} → ${money(h[1]!.spent)} → ${money(h[2]!.spent)}.`,
      });
    }
  }

  // 5. Per-spend creep: your average spend each time you buy from a category is
  //    noticeably higher than your own past average — even if totals look fine.
  for (const r of rows) {
    if (r.txCount < 2) continue;
    const past = r.history.filter((h) => h.month !== month && h.count > 0);
    if (past.length < 2) continue;
    const pastSpent = past.reduce((sum, h) => sum + h.spent, 0);
    const pastCount = past.reduce((sum, h) => sum + h.count, 0);
    if (pastCount < 3) continue;
    const pastAvg = pastSpent / pastCount;
    const nowAvg = r.spent / r.txCount;
    if (pastAvg > 0 && nowAvg >= pastAvg * 1.25 && nowAvg - pastAvg >= 2) {
      insights.push({
        id: `avg-${r.category.id}`,
        kind: "trend",
        tag: "Spending more each time",
        body: `${r.category.name}: you used to average ${money(pastAvg, { cents: true })} a spend, this month it's ${money(nowAvg, { cents: true })}.`,
      });
    }
  }

  // 6. Something calm to end on.
  const improving = rows
    .filter((r) => r.previousSpent > 0 && r.spent < r.previousSpent * 0.9)
    .sort((a, b) => b.previousSpent - b.spent - (a.previousSpent - a.spent))[0];
  if (improving) {
    insights.push({
      id: `good-${improving.category.id}`,
      kind: "ontrack",
      tag: "On track",
      body: `${improving.category.name} is down ${money(improving.previousSpent - improving.spent)} versus ${monthLabel(improving.history.at(-2)?.month ?? month)}.`,
    });
  }

  return insights.slice(0, 6);
}
