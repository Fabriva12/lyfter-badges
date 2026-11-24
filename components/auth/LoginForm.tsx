"use client";

import { useActionState, useState } from "react";

import { authenticate } from "@/app/login/actions";
import type { LoginFormState } from "@/lib/forms";

interface LoginFormProps {
  next: string | null;
}

type Mode = "signin" | "signup";

const initialState: LoginFormState = { error: null };

const inputClassName =
  "w-full rounded-lg border border-stroke bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted transition focus:border-celeste focus:outline-none focus:ring-2 focus:ring-celeste/30";

const labelClassName = "mb-2 block text-sm font-semibold text-subtle";

export default function LoginForm({ next }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );

  const isSignup = mode === "signup";

  function toggleMode() {
    setMode(isSignup ? "signin" : "signup");
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8"
    >
      <input type="hidden" name="intent" value={mode} />
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-5">
        {isSignup ? (
          <div>
            <label htmlFor="name" className={labelClassName}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Ada Lovelace"
              className={inputClassName}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={8}
            required
            placeholder="At least 8 characters"
            className={inputClassName}
          />
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-coral-soft"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-sage px-6 py-3 text-sm font-bold text-[#263021] transition hover:bg-sage-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="w-full rounded-lg border border-stroke px-6 py-3 text-sm font-semibold text-subtle transition hover:bg-ink"
        >
          {isSignup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </form>
  );
}
