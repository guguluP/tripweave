import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { BrandWord, WeaveMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ShakeField, SlidingTabs, Stagger, TextSwap } from "@/components/motion";
import { loadNext } from "@/lib/packages";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const destination = () => loadNext();

  const finish = async () => {
    try {
      await authClient.getSession();
    } catch {
      /* session store recovers */
    }
    const next = destination();
    if (next.startsWith("/")) {
      window.location.assign(next);
      return;
    }
    void nav({ to: "/" });
  };

  const onEmail = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (mode === "up" && !name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (Object.keys(next).length) {
      setErrors(next);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Guest",
        });
        if (err) throw new Error(err.message ?? "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      await finish();
    } catch (err) {
      setErrors({
        password: err instanceof Error ? err.message : "Something went wrong",
      });
      setShakeKey((k) => k + 1);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80"
          alt="Konark stone carving"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-fg/50" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <Stagger>
            <p className="font-display text-3xl text-primary-fg">
              Hold a Puri stay without the noise.
            </p>
            <p className="mt-3 max-w-sm text-sm text-primary-fg/80">
              Sign in to pay, keep bookings, and pick up a brief on any device.
            </p>
          </Stagger>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2">
            <WeaveMark />
            <BrandWord />
          </Link>
          <h1 className="mt-8 font-display text-3xl">
            <TextSwap text={mode === "in" ? "Welcome back" : "Create your account"} />
          </h1>
          <p className="mt-2 text-sm text-muted">
            <TextSwap
              text={
                mode === "in"
                  ? "Sign in to book and see your trips."
                  : "A TripWeave account keeps your paid stays."
              }
            />
          </p>

          <div className="mt-6">
            <SlidingTabs
              fullWidth
              tabs={[
                { id: "in", label: "Sign in" },
                { id: "up", label: "Sign up" },
              ]}
              value={mode}
              onChange={(id) => {
                setMode(id);
                setErrors({});
              }}
            />
          </div>

          {authEnabled ? (
            <>
              <form className="mt-6 grid gap-3" noValidate onSubmit={onEmail}>
                {mode === "up" ? (
                  <ShakeField
                    label="Name"
                    value={name}
                    error={errors.name}
                    shakeKey={shakeKey}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((er) => ({ ...er, name: undefined }));
                    }}
                    autoComplete="name"
                  />
                ) : null}
                <ShakeField
                  label="Email"
                  type="email"
                  value={email}
                  error={errors.email}
                  shakeKey={shakeKey}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((er) => ({ ...er, email: undefined }));
                  }}
                  autoComplete="email"
                />
                <ShakeField
                  label="Password"
                  type="password"
                  value={password}
                  error={errors.password}
                  shakeKey={shakeKey}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((er) => ({ ...er, password: undefined }));
                  }}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  minLength={8}
                />
                <Button type="submit" disabled={busy} className="mt-1 w-full">
                  <TextSwap
                    shimmer={busy}
                    text={
                      busy ? "Please wait" : mode === "in" ? "Sign in" : "Create account"
                    }
                  />
                </Button>
              </form>
              <div className="relative my-6">
                <div className="h-px bg-border" />
                <p className="absolute inset-x-0 -top-2.5 text-center text-xs text-subtle">
                  <span className="bg-bg px-2">or continue with</span>
                </p>
              </div>
              <div className="grid gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: destination() })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </div>
  );
}
