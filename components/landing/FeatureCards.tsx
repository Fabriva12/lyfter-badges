interface FeatureCardProps {
  step: string;
  icon: string;
  title: string;
  description: string;
  iconClassName: string;
}

export default function FeatureCard({
  step,
  icon,
  title,
  description,
  iconClassName,
}: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 transition hover:border-[#4a5563] sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold ${iconClassName}`}
        >
          {icon}
        </div>

        <span
          aria-hidden="true"
          className="font-mono text-xs font-bold text-[#59636f]"
        >
          {step}
        </span>
      </div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-4 text-sm leading-6 text-[#9da5b1]">{description}</p>
    </article>
  );
}
