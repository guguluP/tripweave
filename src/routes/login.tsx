import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { clearDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { BrandWord, WeaveMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ShakeField, SlidingTabs, Stagger, TextSwap } from "@/components/motion";
import { consumeNext, loadNext } from "@/lib/packages";
import { isRealUser } from "@/lib/session-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGIN_HERO, loginCheckoutBody, loginCheckoutPrompt } from "@/lib/login-copy";

type LoginSearch = { error?: string; token?: string };

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    error: typeof s.error === "string" ? s.error : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
  }),
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.6v3h4c2.4-2.2 3.5-5.4 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-4-3c-1.1.7-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.5c-.2-.7-.4-1.4-.4-2.1s.1-1.5.4-2.1V7.2H1.4C.5 8.9 0 10.4 0 12.4s.5 3.5 1.4 5.2l4.1-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l4.1 3.1C6.4 6.8 9 4.8 12 4.8z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M18.2 2H21l-6.5 7.4L22 22h-6.8l-4.5-6.1L5.3 22H2.5l7-8L2 2h7l4.1 5.6L18.2 2zm-1.2 18h1.9L7.1 3.9H5.1L17 20z" />
    </svg>
  );
}

function friendlyAuthError(raw: string) {
  const msg = raw.replace(/[_-]/g, " ").trim();
  const lower = msg.toLowerCase();
  if (lower.includes("already exists") || lower.includes("user already")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (lower.includes("invalid") && (lower.includes("password") || lower.includes("email") || lower.includes("credentials"))) {
    return "Email or password doesn’t match.";
  }
  if (lower.includes("access denied") || lower.includes("cancelled") || lower.includes("access_denied")) {
    return "Sign-in was cancelled.";
  }
  if (lower.includes("invalid redirect")) {
    return "Google is not set up for this site yet. Use email, or add Google Cloud OAuth keys (see README).";
  }
  if (
    lower.includes("sign in failed") ||
    lower.includes("sign-in failed") ||
    lower.includes("internal server") ||
    lower.includes("failed to fetch")
  ) {
    return "Google sign-in did not complete. Try again, or use email.";
  }
  return msg || "Something went wrong. Try again.";
}

function isExistingAccountError(raw: string) {
  const lower = raw.toLowerCase();
  return lower.includes("already exists") || lower.includes("user already") || lower.includes("email already");
}

function nextCopy(path: string) {
  if (path.startsWith("/checkout")) return loginCheckoutPrompt();
  if (path.startsWith("/account") || path.startsWith("/trips")) return "Sign in to see your trips.";
  return "Sign in with Google or your email.";
}

async function waitForSession(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { data } = await authClient.getSession();
      if (data?.user) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return false;
}

function Login() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up" | "reset">(search.token ? "reset" : "in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);
  const [nextPath] = useState(() => loadNext());
  const redirected = useRef(false);
  clearDemoMode();

  const goNext = () => {
    if (redirected.current) return;
    redirected.current = true;
    window.location.assign(consumeNext());
  };

  const signedIn = isRealUser(user);

  useEffect(() => {
    if (!isPending && signedIn) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, isPending]);

  useEffect(() => {
    if (search.error) {
      setErrors({ form: friendlyAuthError(search.error) });
    }
  }, [search.error]);

  const onEmail = async (e: FormEvent) => {
    e.preventDefault();
    const mailer = authClient as typeof authClient & {
      requestPasswordReset: (input: { email: string; redirectTo: string }) => Promise<{ error: { message?: string } | null }>;
      resetPassword: (input: { newPassword: string; token: string }) => Promise<{ error: { message?: string } | null }>;
    };
    if (mode === "reset") {
      const next: typeof errors = {};
      if (search.token) {
        if (password.length < 8) next.password = "Use at least 8 characters.";
        if (password !== confirm) next.confirm = "Passwords don’t match.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        next.email = "Please enter a valid email.";
      }
      if (Object.keys(next).length) {
        setErrors(next);
        setShakeKey((k) => k + 1);
        return;
      }
      setErrors({});
      setBusy(true);
      try {
        if (search.token) {
          const { error: err } = await mailer.resetPassword({ newPassword: password, token: search.token });
          if (err) throw new Error(err.message ?? "Could not reset password");
          setPassword("");
          setConfirm("");
          setMode("in");
          setErrors({ form: "Password updated. Sign in with the new password." });
        } else {
          const { error: err } = await mailer.requestPasswordReset({
            email: email.trim().toLowerCase(),
            redirectTo: `${window.location.origin}/login`,
          });
          if (err) throw new Error(err.message ?? "Could not send reset email");
          setErrors({ form: "If that email has an account, a reset link is on its way." });
        }
      } catch (err) {
        setErrors({ form: friendlyAuthError(err instanceof Error ? err.message : "Could not reset password") });
        setShakeKey((k) => k + 1);
      } finally {
        setBusy(false);
      }
      return;
    }
    const next: typeof errors = {};
    if (mode === "up" && !name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (mode === "up" && password !== confirm) next.confirm = "Passwords don’t match.";
    if (Object.keys(next).length) {
      setErrors(next);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      clearDemoMode();
      const cleanEmail = email.trim().toLowerCase();
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: cleanEmail,
          password,
          name: name.trim() || cleanEmail.split("@")[0] || "Guest",
        });
        if (err) throw new Error(err.message ?? "Could not create account");
        const { error: signInErr } = await authClient.signIn.email({
          email: cleanEmail,
          password,
        });
        if (signInErr) throw new Error(signInErr.message ?? "Account created, but sign-in failed");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: cleanEmail,
          password,
        });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      const hasSession = await waitForSession();
      if (!hasSession) {
        throw new Error("Signed in, but session did not appear. Try again.");
      }
      goNext();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      if (mode === "up" && isExistingAccountError(raw)) {
        setMode("in");
        setConfirm("");
        setErrors({ form: friendlyAuthError(raw) });
      } else {
        setErrors({ form: friendlyAuthError(raw) });
      }
      setShakeKey((k) => k + 1);
      setBusy(false);
    }
  };

  const onOauth = async (providerId: string) => {
    clearDemoMode();
    setErrors({});
    setOauthBusy(providerId);
    try {
      await signIn(providerId, {
        callbackURL: loadNext(),
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setErrors({
        form: friendlyAuthError(err instanceof Error ? err.message : "Sign-in was cancelled"),
      });
      setOauthBusy(null);
    }
  };

  if (isPending || signedIn) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  const google = GROK_PROVIDERS.find((p) => p.idp === "google");
  const others = GROK_PROVIDERS.filter((p) => p.idp !== "google");

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={LOGIN_HERO.src}
          alt={LOGIN_HERO.alt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-fg/50" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <Stagger>
            <p className="font-display text-3xl text-primary-fg">Hold a Puri stay without the noise.</p>
            <p className="mt-3 max-w-sm text-sm text-primary-fg/80">{nextCopy(nextPath)}</p>
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
            <TextSwap text={mode === "reset" ? "Reset password" : mode === "in" ? "Welcome back" : "Create your account"} />
          </h1>
          <p className="mt-2 text-sm text-muted">
            <TextSwap
              text={
                nextPath.startsWith("/checkout")
                  ? loginCheckoutBody()
                  : mode === "reset"
                    ? search.token
                      ? "Choose a new password for your email account."
                      : "We will email you a link to choose a new password."
                    : mode === "in"
                    ? "Sign in with Google, or with the email you registered."
                    : "Create an account with your email, or continue with Google."
              }
            />
          </p>

          {authEnabled ? (
            <>
              {errors.form ? (
                <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                  {errors.form}
                </p>
              ) : null}

              <div className="mt-6 grid gap-2">
                {google ? (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={Boolean(oauthBusy) || busy}
                    onClick={() => void onOauth(google.providerId)}
                  >
                    <GoogleMark />
                    {oauthBusy === google.providerId ? "Redirecting…" : "Continue with Google"}
                  </Button>
                ) : null}
                {typeof window !== "undefined" &&
                window.location.hostname.endsWith(".vercel.app")
                  ? null
                  : others.map((p) => (
                      <Button
                        key={p.providerId}
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={Boolean(oauthBusy) || busy}
                        onClick={() => void onOauth(p.providerId)}
                      >
                        <XMark />
                        {oauthBusy === p.providerId ? "Redirecting…" : `Continue with ${p.label}`}
                      </Button>
                    ))}
              </div>

              {emailAndPasswordEnabled ? (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-bg px-2 text-muted">or email</span>
                    </div>
                  </div>

                  {mode === "reset" ? null : (
                  <SlidingTabs
                    fullWidth
                    tabs={[
                      { id: "in", label: "Sign in" },
                      { id: "up", label: "Sign up" },
                    ]}
                    value={mode}
                    onChange={(id) => {
                      setMode(id as "in" | "up");
                      setErrors((er) => ({ ...er, form: undefined, name: undefined, confirm: undefined }));
                    }}
                  />
                  )}

                  <form className="mt-6 grid gap-3" noValidate onSubmit={onEmail}>
                    {mode === "up" ? (
                      <ShakeField
                        label="Name"
                        name="name"
                        value={name}
                        error={errors.name}
                        shakeKey={shakeKey}
                        onChange={(e) => {
                          setName(e.target.value);
                          setErrors((er) => ({ ...er, name: undefined, form: undefined }));
                        }}
                        autoComplete="name"
                      />
                    ) : null}
                    {mode === "reset" && search.token ? null : (
                    <ShakeField
                      label="Email"
                      type="email"
                      name="email"
                      value={email}
                      error={errors.email}
                      shakeKey={shakeKey}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((er) => ({ ...er, email: undefined, form: undefined }));
                      }}
                      autoComplete="email"
                    />
                    )}
                    {mode === "reset" && !search.token ? null : (
                    <ShakeField
                      label={mode === "reset" ? "New password" : "Password"}
                      type="password"
                      name="password"
                      value={password}
                      error={errors.password}
                      shakeKey={shakeKey}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((er) => ({ ...er, password: undefined, form: undefined }));
                      }}
                      autoComplete={mode === "in" ? "current-password" : "new-password"}
                    />
                    )}
                    {mode === "up" || (mode === "reset" && search.token) ? (
                      <ShakeField
                        label="Confirm password"
                        type="password"
                        name="confirm"
                        value={confirm}
                        error={errors.confirm}
                        shakeKey={shakeKey}
                        onChange={(e) => {
                          setConfirm(e.target.value);
                          setErrors((er) => ({ ...er, confirm: undefined, form: undefined }));
                        }}
                        autoComplete="new-password"
                      />
                    ) : null}
                    {mode === "in" ? (
                      <button
                        type="button"
                        className="text-left text-sm text-muted underline-offset-4 hover:underline"
                        onClick={() => {
                          setMode("reset");
                          setErrors({});
                        }}
                      >
                        Forgot password
                      </button>
                    ) : null}
                    {mode === "reset" && !search.token ? (
                      <button
                        type="button"
                        className="text-left text-sm text-muted underline-offset-4 hover:underline"
                        onClick={() => setMode("in")}
                      >
                        Back to sign in
                      </button>
                    ) : null}
                    <Button type="submit" variant="outline" className="w-full" disabled={busy || Boolean(oauthBusy)}>
                      {busy
                        ? "Working…"
                        : mode === "reset"
                          ? search.token
                            ? "Save new password"
                            : "Email reset link"
                          : mode === "in"
                            ? "Sign in with email"
                            : "Create Account"}
                    </Button>
                  </form>
                </>
              ) : null}
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Auth is off in this environment.</p>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            <Link to="/" className="underline-offset-4 hover:underline">Back to Discover</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
