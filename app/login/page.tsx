"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  REMEMBER_KEY,
  SESSION_START_KEY,
} from "@/lib/auth/remember-me";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const forbidden = params.has("forbidden");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (forbidden) {
      setError("That account isn’t allowed here.");
    }
    if (typeof window !== "undefined") {
      const expired = window.sessionStorage.getItem("__planner_session_expired");
      if (expired === "1") {
        setNotice("Your session expired — please sign in again.");
        window.sessionStorage.removeItem("__planner_session_expired");
      }
    }
  }, [forbidden]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      // Persist the remember-me preference. The middleware always allows the
      // session through, but a layout-level effect signs out an idle "not
      // remembered" session after 4 hours.
      if (typeof window !== "undefined") {
        localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
        sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand-icon.png"
            alt=""
            width={56}
            height={56}
            priority
            className="mb-4 h-14 w-14 rounded-2xl"
          />
          <h1 className="font-serif text-[28px] font-medium leading-tight tracking-tight">
            Planner
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Sign in to access your library.
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[12.5px] text-foreground/90">
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            Remember this computer
          </label>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !email || !password}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-center text-[10.5px] text-muted-foreground/70">
          One-person app. Sign-ups disabled.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
