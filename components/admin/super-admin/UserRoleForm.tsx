"use client";

import { useActionState } from "react";

import { updateUserRole } from "@/app/super-admin/actions";
import { initialAdminFormState } from "@/lib/admin/forms";
import { ROLE_LABELS } from "@/lib/format";

const ROLE_OPTIONS = ["ATTENDEE", "ADMIN", "SUPER_ADMIN"] as const;

interface UserRoleFormProps {
  userId: string;
  role: string;
  disabled?: boolean;
}

export default function UserRoleForm({
  userId,
  role,
  disabled = false,
}: UserRoleFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateUserRole,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />

      <select
        name="role"
        defaultValue={role}
        disabled={disabled || isPending}
        aria-label="Rol"
        className="rounded-lg border border-stroke bg-background px-2 py-1.5 text-xs font-semibold text-foreground transition focus:border-celeste focus:outline-none focus:ring-2 focus:ring-celeste/30 disabled:opacity-60"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option] ?? option}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-subtle transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar"}
      </button>

      {state.status !== "idle" ? (
        <span
          role={state.status === "error" ? "alert" : "status"}
          className={`text-xs ${
            state.status === "error" ? "text-coral-soft" : "text-sage"
          }`}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
