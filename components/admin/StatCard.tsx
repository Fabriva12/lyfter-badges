interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#39424f] bg-[#252c35] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#f1f1ed]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#9ca3af]">{hint}</p> : null}
    </div>
  );
}
