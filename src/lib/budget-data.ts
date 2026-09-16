import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, currentMonthKey, monthKeyOfDateString, type MonthKey } from "@/lib/month";

export type Category = {
  id: string;
  name: string;
  note: string | null;
  color: string;
  sort_order: number;
  archived: boolean;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string;
  amount: number;
};

export type Expense = {
  id: string;
  category_id: string;
  amount: number;
  spent_on: string;
  note: string | null;
};

export const STARTER_CATEGORIES = [
  { name: "Food", note: "meals out" },
  { name: "Groceries", note: "weekly run" },
  { name: "Drinks", note: "coffee & co" },
  { name: "Matcha", note: "the habit" },
  { name: "BBT", note: "bubble tea" },
  { name: "Snacks", note: "small bites" },
  { name: "Cab", note: "rides" },
  { name: "Cell phone", note: "monthly bill" },
  { name: "Household", note: "home upkeep" },
  { name: "Health", note: "clinic & meds" },
  { name: "Personal spending", note: "for me" },
  { name: "Give", note: "generosity" },
  { name: "Offering", note: "church" },
  { name: "Savings", note: "set aside" },
];

/** Window of history we load for comparisons. */
const HISTORY_MONTHS = 12;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, note, color, sort_order, archived")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async (): Promise<Budget[]> => {
      const from = addMonths(currentMonthKey(), -HISTORY_MONTHS);
      const { data, error } = await supabase
        .from("budgets")
        .select("id, category_id, month, amount")
        .gte("month", from);
      if (error) throw error;
      return (data ?? []).map((b) => ({ ...b, amount: Number(b.amount) })) as Budget[];
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async (): Promise<Expense[]> => {
      const from = addMonths(currentMonthKey(), -HISTORY_MONTHS);
      const { data, error } = await supabase
        .from("expenses")
        .select("id, category_id, amount, spent_on, note")
        .gte("spent_on", from)
        .order("spent_on", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[];
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
  };
}

async function userId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("You need to be signed in.");
  return id;
}

export function useAddCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { name: string; note?: string }) => {
      const user_id = await userId();
      const { error } = await supabase.from("categories").insert({
        user_id,
        name: input.name.trim(),
        note: input.note?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useSeedStarterCategories() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async () => {
      const user_id = await userId();
      const rows = STARTER_CATEGORIES.map((c, i) => ({
        user_id,
        name: c.name,
        note: c.note,
        sort_order: i,
      }));
      const { error } = await supabase.from("categories").insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; note: string | null }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: input.name.trim(), note: input.note?.trim() || null })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useSetBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { categoryId: string; month: MonthKey; amount: number }) => {
      const user_id = await userId();
      const { error } = await supabase.from("budgets").upsert(
        {
          user_id,
          category_id: input.categoryId,
          month: input.month,
          amount: input.amount,
        },
        { onConflict: "user_id,category_id,month" },
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCopyBudgetsFromPreviousMonth() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { month: MonthKey; previous: Budget[] }) => {
      const user_id = await userId();
      if (!input.previous.length) throw new Error("No budgets to copy from last month.");
      const rows = input.previous.map((b) => ({
        user_id,
        category_id: b.category_id,
        month: input.month,
        amount: b.amount,
      }));
      const { error } = await supabase
        .from("budgets")
        .upsert(rows, { onConflict: "user_id,category_id,month" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAddExpense() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      categoryId: string;
      amount: number;
      spentOn: string;
      note?: string;
    }) => {
      const user_id = await userId();
      const { error } = await supabase.from("expenses").insert({
        user_id,
        category_id: input.categoryId,
        amount: input.amount,
        spent_on: input.spentOn,
        note: input.note?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Aggregations used by every panel. */
export type CategoryMonth = {
  category: Category;
  spent: number;
  budget: number;
  previousSpent: number;
  history: { month: MonthKey; spent: number; count: number }[];
  txCount: number;
};

export function spentByCategory(expenses: Expense[], month: MonthKey) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (monthKeyOfDateString(e.spent_on) !== month) continue;
    map.set(e.category_id, (map.get(e.category_id) ?? 0) + e.amount);
  }
  return map;
}

export function countByCategory(expenses: Expense[], month: MonthKey) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (monthKeyOfDateString(e.spent_on) !== month) continue;
    map.set(e.category_id, (map.get(e.category_id) ?? 0) + 1);
  }
  return map;
}

export function budgetByCategory(budgets: Budget[], month: MonthKey) {
  const map = new Map<string, number>();
  for (const b of budgets) {
    if (b.month !== month) continue;
    map.set(b.category_id, b.amount);
  }
  return map;
}

/**
 * Orders categories by how often they're used (most-used first).
 * Ties — e.g. a fresh account with no spends yet — fall back to A–Z.
 */
export function sortByUsage(categories: Category[], expenses: Expense[]): Category[] {
  const counts = new Map<string, number>();
  for (const e of expenses) counts.set(e.category_id, (counts.get(e.category_id) ?? 0) + 1);
  return [...categories].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name),
  );
}
