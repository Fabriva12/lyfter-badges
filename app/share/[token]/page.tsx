import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ShareCollectionActions from "@/components/share/ShareCollectionActions";
import { getRequestOrigin } from "@/lib/request";
import { buildCollectionShareText } from "@/lib/share";
import { loadShareCollection } from "@/lib/share/collection";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const collection = await loadShareCollection(token);

  if (!collection) {
    return { title: "Colección no encontrada" };
  }

  const title = `Colección de ${collection.attendeeName}`;
  const description = `${collection.attendeeName} recolectó ${collection.collected} de ${collection.total} insignias en ${collection.eventName} (${collection.xp} XP) con Lyfter Badges.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "Lyfter Badges",
      title,
      description,
      url: `/share/${token}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const collection = await loadShareCollection(token);

  if (!collection) {
    notFound();
  }

  const origin = await getRequestOrigin();
  const shareUrl = `${origin}/share/${token}`;
  const imageUrl = `${origin}/share/${token}/opengraph-image/collection`;
  const text = buildCollectionShareText({
    attendeeName: collection.attendeeName,
    eventName: collection.eventName,
    collected: collection.collected,
    total: collection.total,
    xp: collection.xp,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[960px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Colección compartida
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {collection.attendeeName} · colección
          </h1>
          <p className="mt-2 text-sm text-muted">
            {collection.eventName} · {collection.eventDate}
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-xl border border-stroke bg-surface p-4 shadow-2xl shadow-black/30 sm:p-8">
            <Image
              src={imageUrl}
              alt={`Colección de insignias de ${collection.attendeeName} en ${collection.eventName}`}
              width={1080}
              height={1080}
              unoptimized
              className="mx-auto w-full max-w-[640px] rounded-lg"
            />

            <dl className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-stroke bg-surface-low px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Insignias
                </dt>
                <dd className="mt-1 text-lg font-bold text-foreground">
                  {collection.collected} / {collection.total}
                </dd>
              </div>
              <div className="rounded-lg border border-stroke bg-surface-low px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                  XP
                </dt>
                <dd className="mt-1 text-lg font-bold text-sage">
                  {collection.xp}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <ShareCollectionActions
                url={shareUrl}
                text={text}
                imageUrl={imageUrl}
                title={`Colección de ${collection.attendeeName}`}
              />
            </div>
          </section>

          <section className="rounded-xl border border-stroke bg-surface-low p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-lg font-bold text-foreground">
              Recolecta tus propias insignias
            </h2>
            <p className="mt-2 text-sm text-muted">
              Escanea los códigos QR de las charlas y los stands de Lyfter, gana XP
              y arma tu propia colección.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-sage px-6 text-sm font-bold text-[#263021] transition hover:bg-sage-soft"
            >
              Crear cuenta
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
