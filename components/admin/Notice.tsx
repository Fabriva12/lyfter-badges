import type { ReactNode } from "react";

interface NoticeProps {
  tone?: "success" | "error" | "info";
  children: ReactNode;
}

const tones = {
  success: "border-sage/40 bg-sage/10 text-sage/60",
  error: "border-coral/40 bg-coral/10 text-coral-soft",
  info: "border-celeste/40 bg-celeste/10 text-celeste/60",
} as const;

export default function Notice({ tone = "info", children }: NoticeProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${tones[tone]}`}
    >
      {children}
    </p>
  );
}
