import FeatureCard from "./FeatureCards";

const features = [
  {
    step: "01",
    icon: "↘",
    title: "Escaneá y coleccioná badges",
    description:
      "Apuntá al QR de cada charla o stand y sumá el badge a tu colección al instante.",
    iconClassName: "bg-[#38c6f3] text-[#17313b]",
  },
  {
    step: "02",
    icon: "↑",
    title: "Subí de nivel",
    description:
      "Cada badge te da XP. Acumulá experiencia y desbloqueá nuevos niveles durante el evento.",
    iconClassName: "bg-[#d77bdb] text-[#352238]",
  },
  {
    step: "03",
    icon: "≡",
    title: "Compará tu posición",
    description:
      "Mirá el leaderboard en vivo y competí con el resto de los asistentes por el podio.",
    iconClassName: "bg-[#f47f8a] text-[#43272b]",
  },
];

export default function Features() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-10"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#36bde9]">
          Cómo funciona
        </p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Escaneá. Sumá XP. Competí.
        </h2>
        <p className="mt-4 text-base leading-7 text-[#9ca3af] sm:text-lg">
          Tres pasos y tu asistencia se convierte en una colección que podés
          compartir.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
