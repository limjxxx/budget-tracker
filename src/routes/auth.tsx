import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nest budget tracker" },
      {
        name: "description",
        content: "Sign in or create your Nest account to track budgets by category.",
      },
      { property: "og:title", content: "Sign in — Nest budget tracker" },
      {
        property: "og:description",
        content: "Sign in or create your Nest account to track budgets by category.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || null },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        toast.success("Welcome to Nest");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in didn't work. Try again or use your email.");
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10 text-ink">
      <div className="pointer-events-none absolute -left-40 -top-32 size-[480px] rounded-full bg-card/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[520px] rounded-full bg-accent/10 blur-3xl" />

      <div className="rise panel relative w-full max-w-[420px] p-7">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-[13px] font-semibold text-primary-foreground">
            N
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Nest</div>
            <div className="label-mono mt-1">Budget tracker</div>
          </div>
        </Link>

        {checkEmail ? (
          <div className="mt-7">
            <h1 className="font-serif text-2xl italic tracking-tight">Check your inbox</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              We sent a confirmation link to {email}. Click it and you'll land straight in your
              budget.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-7 font-serif text-2xl italic tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              {mode === "signup" ? (
                <label className="block">
                  <span className="label-mono">Display name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg bg-card/80 px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
                    placeholder="Jia Xin"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="label-mono">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg bg-card/80 px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
                  placeholder="you@email.com"
                />
              </label>
              <label className="block">
                <span className="label-mono">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg bg-card/80 px-3 py-2.5 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-ink px-3 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-ink/90 disabled:opacity-60"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="label-mono">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-lg bg-card px-3 py-2.5 text-[13px] font-medium ring-1 ring-border hover:bg-card/70 disabled:opacity-60"
            >
              Continue with Google
            </button>

            <p className="mt-5 text-center text-[12px] text-muted-foreground">
              {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-medium text-ink underline underline-offset-2"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
