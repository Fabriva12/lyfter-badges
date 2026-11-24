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
  "w-full rounded-lg border border-[#39424f] bg-[#171b21] px-4 py-3 text-sm text-[#f1f1ed] placeholder:text-[#6b7280] transition focus:border-[#36bde9] focus:outline-none focus:ring-2 focus:ring-[#36bde9]/30";

const labelClassName = "mb-2 block text-sm font-semibold text-[#d7dce3]";

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
      className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8"
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
            className="rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-[#a8d889] px-6 py-3 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="w-full rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
        >
          {isSignup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </form>
  );
}
