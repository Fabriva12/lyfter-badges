import type { ReactNode } from "react";

interface NoticeProps {
  tone?: "success" | "error" | "info";
  children: ReactNode;
}

const tones = {
  success: "border-[#a8d889]/40 bg-[#a8d889]/10 text-[#d8f0c4]",
  error: "border-[#f47f8a]/40 bg-[#f47f8a]/10 text-[#ffb3ba]",
  info: "border-[#36bde9]/40 bg-[#36bde9]/10 text-[#c9effb]",
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
