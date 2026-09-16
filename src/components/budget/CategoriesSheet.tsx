import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/budget-data";

export function CategoriesSheet({
  categories,
  onAdd,
  onRename,
  onDelete,
  busy,
}: {
  categories: Category[];
  onAdd: (input: { name: string; note?: string }) => void;
  onRename: (input: { id: string; name: string; note: string | null }) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-lg bg-card px-3 py-2 text-[13px] font-medium ring-1 ring-border hover:bg-card/70">
          Categories
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl italic tracking-tight">Categories</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("Give the category a name.");
              return;
            }
            onAdd({ name });
            setName("");
          }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category"
            className="min-w-0 rounded-lg bg-card px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-ink px-3 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-ink/90 disabled:opacity-60"
          >
            Add
          </button>
        </form>

        <div className="mt-2 divide-y divide-border">
          {categories.map((c) => (
            <div key={c.id} className="py-2">
              {editingId === c.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onRename({ id: c.id, name: editName, note: null });
                    setEditingId(null);
                  }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="min-w-0 rounded-lg bg-card px-2.5 py-2 text-[13px] outline-none ring-1 ring-ring"
                  />
                  <button className="rounded-lg bg-accent px-3 py-2 text-[12px] font-medium text-accent-foreground">
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="cat-name truncate text-[12px] text-ink">{c.name}</div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    className="font-mono text-[10px] text-muted-foreground hover:text-ink"
                  >
                    rename
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${c.name}? Its budgets and expenses go with it.`)) {
                        onDelete(c.id);
                      }
                    }}
                    className="font-mono text-[10px] text-muted-foreground hover:text-warn"
                  >
                    delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
