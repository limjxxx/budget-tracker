import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nest — a simple budget tracker" },
      {
        name: "description",
        content:
          "Set a monthly budget per category, see how each one is filling up, compare past months, and get clear suggestions on what to cut back.",
      },
      { property: "og:title", content: "Nest — a simple budget tracker" },
      {
        property: "og:description",
        content:
          "Set a monthly budget per category, compare months, and get specific suggestions on what to trim.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-ink">
      <div className="pointer-events-none absolute -left-40 -top-32 size-[480px] rounded-full bg-card/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 size-[520px] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[460px] rounded-full bg-card/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1240px] flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-[13px] font-semibold text-primary-foreground">
              N
            </div>
            <div className="text-sm font-semibold leading-none">Nest</div>
          </div>
          {loading ? null : user ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-ink/90"
            >
              Open my budget
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-ink/90"
            >
              Sign in
            </Link>
          )}
        </header>

        <main className="rise mt-16 grid flex-1 grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <p className="label-mono">Budget by category, month by month</p>
            <h1 className="mt-4 max-w-[18ch] text-5xl font-semibold leading-[1.05] tracking-tight">
              Every category gets a budget.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
              Add what you spend on food, matcha, bubble tea, cabs, giving and savings. Nest shows
              how each category is doing, compares it to the months before, and tells you plainly
              where to cut back.
            </p>
            <div className="mt-8">
              <Link
                to="/auth"
                className="inline-flex rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-foreground hover:bg-accent/90"
              >
                Start my budget
              </Link>
            </div>
          </section>

          <section className="panel space-y-4 p-5 lg:col-span-5">
            <div className="label-mono">A month at a glance</div>
            {[
              { name: "Matcha", width: "100%", spent: "S$116", tone: "warn" },
              { name: "Food", width: "78%", spent: "S$312", tone: "ink" },
              { name: "Cab", width: "45%", spent: "S$72", tone: "ink" },
              { name: "Savings", width: "83%", spent: "S$500", tone: "accent" },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-3">
                <div className="w-24">
                  <div className="cat-name truncate text-[12px] text-ink">{row.name}</div>
                </div>
                <div className="track h-1.5 flex-1">
                  <div
                    className={`bar-grow h-full rounded-full ${
                      row.tone === "warn"
                        ? "bg-warn"
                        : row.tone === "accent"
                          ? "bg-accent"
                          : "bg-ink/70"
                    }`}
                    style={{ width: row.width }}
                  />
                </div>
                <div className="w-16 text-right font-mono text-[13px]">{row.spent}</div>
              </div>
            ))}
            <div className="rounded-xl bg-accent/10 p-3.5">
              <div className="label-mono text-accent">Top insight</div>
              <p className="mt-1.5 text-[13px] leading-snug">
                Matcha + BBT is 14% of spend. Trim{" "}
                <span className="font-mono font-medium">S$40</span> to hit your savings goal.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
