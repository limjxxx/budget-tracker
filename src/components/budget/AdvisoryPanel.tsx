import type { Insight } from "@/lib/insights";

const toneFor: Record<Insight["kind"], string> = {
  overspend: "text-warn",
  rebalance: "text-accent",
  saving: "text-accent",
  trend: "text-warn",
  ontrack: "text-good",
};

export function AdvisoryPanel({
  insights,
  onApply,
  busy,
}: {
  insights: Insight[];
  onApply: (insight: Insight) => void;
  busy: boolean;
}) {
  return (
    <div className="rise panel-solid p-5">
      <div className="flex items-center justify-between">
        <div className="font-serif text-lg italic tracking-tight">Advisory</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {insights.length} {insights.length === 1 ? "note" : "notes"}
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Log a few expenses and set budgets — recommendations on what to trim and rebalance show up
          here.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {insights.map((insight, i) => (
            <div
              key={insight.id}
              className={`rounded-xl p-3.5 ${
                i === 0 ? "bg-accent/10 ring-1 ring-accent/20" : "bg-card/60 ring-1 ring-border"
              }`}
            >
              <div className={`label-mono ${toneFor[insight.kind]}`}>{insight.tag}</div>
              <p className="mt-1.5 text-[13px] leading-snug">{insight.body}</p>
              {insight.action ? (
                <button
                  onClick={() => onApply(insight)}
                  disabled={busy}
                  className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
                >
                  {insight.action.label}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
