const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
} as const;

type SpinnerSize = keyof typeof sizeClasses;

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export default function Spinner({
  size = "md",
  label = "Cargando…",
  className = "",
}: SpinnerProps) {
  return (
    <span role="status" className="inline-flex">
      <span
        aria-hidden="true"
        className={`block rounded-full border-stroke border-t-sage motion-safe:animate-spin motion-reduce:animate-pulse ${sizeClasses[size]} ${className}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
