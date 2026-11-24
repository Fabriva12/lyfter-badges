"use server";

import { isAPIError } from "better-auth/api";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { LoginFormState } from "@/lib/forms";
import { sanitizeNextPath } from "@/lib/redirect";

const INVALID_CREDENTIALS = "Correo electrónico o contraseña inválidos.";
const UNEXPECTED_ERROR = "Ocurrió un error. Inténtalo de nuevo.";

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
    return { error: "Ingresa un correo electrónico válido." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (intent === "signup" && !name) {
    return { error: "Ingresa tu nombre." };
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
