"use client";

import { useState } from "react";
import { signInWithMagicLink, signInWithPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function LoginPanel() {
  const [mode, setMode] = useState<"password" | "magic">("password");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--accent-soft)] p-1">
        <button
          type="button"
          className={cn(
            "rounded-lg py-2.5 text-sm font-semibold transition",
            mode === "password"
              ? "bg-white text-[var(--primary)] shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          )}
          onClick={() => setMode("password")}
        >
          Password
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg py-2.5 text-sm font-semibold transition",
            mode === "magic"
              ? "bg-white text-[var(--primary)] shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          )}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form action={signInWithPassword} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
          <SubmitButton className="w-full" pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      ) : (
        <form action={signInWithMagicLink} className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            We&apos;ll email you a secure link. No password needed.
          </p>
          <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          <SubmitButton className="w-full" variant="secondary" pendingLabel="Sending link…">
            Send magic link
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
