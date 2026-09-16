export function money(amount: number, opts: { cents?: boolean } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  return `S$${value.toLocaleString("en-SG", {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  })}`;
}

export function signedMoney(delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${money(Math.abs(delta))}`;
}

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
