/** Month keys are always the first day of the month: "YYYY-MM-01". */
export type MonthKey = string;

export function monthKeyOf(date: Date): MonthKey {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}-01`;
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(new Date());
}

function parts(key: MonthKey): [number, number] {
  const bits = key.split("-").map(Number);
  return [bits[0] ?? 1970, bits[1] ?? 1];
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [y, m] = parts(key);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function monthLabel(key: MonthKey, style: "short" | "long" = "short") {
  const [y, m] = parts(key);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-SG", {
    month: style === "long" ? "long" : "short",
    year: style === "long" ? "numeric" : undefined,
  });
}

export function monthKeyOfDateString(dateStr: string): MonthKey {
  return `${dateStr.slice(0, 7)}-01`;
}

/** Recent month keys, oldest first, ending at `end`. */
export function recentMonths(end: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - (count - 1)));
}

export function daysInMonth(key: MonthKey) {
  const [y, m] = parts(key);
  return new Date(y, m, 0).getDate();
}

/** How far through the month we are (0-1). Past months are 1. */
export function monthProgress(key: MonthKey) {
  const now = new Date();
  if (key < currentMonthKey()) return 1;
  if (key > currentMonthKey()) return 0;
  return now.getDate() / daysInMonth(key);
}

export function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}
