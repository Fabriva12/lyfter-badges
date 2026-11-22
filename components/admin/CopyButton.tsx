"use client";

import { useState } from "react";

import { secondaryButtonClassName } from "@/components/admin/formStyles";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export default function CopyButton({
  value,
  label = "Copiar enlace",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${secondaryButtonClassName} px-3 py-2 text-xs`}
    >
      {copied ? "Copiado" : label}
    </button>
  );
}
