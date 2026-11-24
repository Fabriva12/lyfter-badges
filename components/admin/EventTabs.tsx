import Link from "next/link";

const TABS = [
  { key: "overview", label: "Resumen", path: "" },
  { key: "badges", label: "Insignias y QR", path: "/badges" },
  { key: "prize", label: "Premio", path: "/prize" },
  { key: "attendees", label: "Participantes", path: "/attendees" },
  { key: "scans", label: "Escaneos", path: "/scans" },
  { key: "metrics", label: "Métricas", path: "/metrics" },
  { key: "audit", label: "Auditoría", path: "/audit" },
] as const;

export type EventTabKey = (typeof TABS)[number]["key"];

interface EventTabsProps {
  eventId: string;
  active: EventTabKey;
}

export default function EventTabs({ eventId, active }: EventTabsProps) {
  return (
    <nav
      aria-label="Secciones del evento"
      className="-mx-4 flex gap-2 overflow-x-auto border-b border-stroke px-4 pb-3 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key}
            href={`/admin/events/${eventId}${tab.path}`}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-celeste/15 text-celeste-soft"
                : "text-muted hover:bg-ink hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
