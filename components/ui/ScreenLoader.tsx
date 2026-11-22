import Spinner from "@/components/ui/Spinner";

interface ScreenLoaderProps {
  label?: string;
}

export default function ScreenLoader({ label = "Loading…" }: ScreenLoaderProps) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 py-16">
      <Spinner size="lg" label={label} />
      <p aria-hidden="true" className="text-sm font-semibold text-[#9ca3af]">
        {label}
      </p>
    </div>
  );
}
