"use server";

import { isAPIError } from "better-auth/api";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { LoginFormState } from "@/lib/forms";
import { sanitizeNextPath } from "@/lib/redirect";

const INVALID_CREDENTIALS = "Invalid email or password.";
const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

export async function authenticate(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const intent = formData.get("intent") === "signup" ? "signup" : "signin";
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextPath(formData.get("next"));

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (intent === "signup" && !name) {
    return { error: "Enter your name." };
  }

  try {
    if (intent === "signup") {
      await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
      });
    } else {
      await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });
    }
  } catch (error) {
    if (isAPIError(error)) {
      return {
        error: intent === "signup" ? error.message : INVALID_CREDENTIALS,
      };
    }

    return { error: UNEXPECTED_ERROR };
  }

  redirect(next ?? "/");
}
