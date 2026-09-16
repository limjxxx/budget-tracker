type Tab<T extends string> = { value: T; label: string };

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-card/60 p-1 ring-1 ring-border">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition ${
              active
                ? "bg-panel-solid text-ink shadow-sm"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
