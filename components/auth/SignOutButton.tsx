"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setError("");

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/");
            router.refresh();
          },
          onError: (context) => {
            console.error("Could not sign out.", context.error);
            setError("No se pudo cerrar la sesión. Intentá de nuevo.");
          },
        },
      });
    } catch (cause) {
      console.error("Could not sign out.", cause);
      setError("No se pudo cerrar la sesión. Intentá de nuevo.");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-[#f47f8a] px-5 py-2 text-sm font-semibold text-[#ffb3ba] transition hover:bg-[#f47f8a]/10"
      >
        Cerrar sesión
      </button>
      {error ? (
        <span role="alert" className="text-xs text-[#ffb3ba]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
