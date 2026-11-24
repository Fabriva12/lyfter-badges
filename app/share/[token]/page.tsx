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
    return { title: "Collection not found" };
  }

  const title = `${collection.attendeeName}'s collection`;
  const description = `${collection.attendeeName} collected ${collection.collected} of ${collection.total} badges at ${collection.eventName} (${collection.xp} XP) with Lyfter Badges.`;

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
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[960px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Shared collection
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {collection.attendeeName}&apos;s collection
          </h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {collection.eventName} · {collection.eventDate}
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-4 shadow-2xl shadow-black/30 sm:p-8">
            <Image
              src={imageUrl}
              alt={`${collection.attendeeName}'s ${collection.eventName} badge collection`}
              width={1080}
              height={1080}
              unoptimized
              className="mx-auto w-full max-w-[640px] rounded-lg"
            />

            <dl className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-[#394351] bg-[#1f252d] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                  Badges
                </dt>
                <dd className="mt-1 text-lg font-bold text-[#f1f1ed]">
                  {collection.collected} / {collection.total}
                </dd>
              </div>
              <div className="rounded-lg border border-[#394351] bg-[#1f252d] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                  XP
                </dt>
                <dd className="mt-1 text-lg font-bold text-[#a8d889]">
                  {collection.xp}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <ShareCollectionActions
                url={shareUrl}
                text={text}
                imageUrl={imageUrl}
                title={`${collection.attendeeName}'s collection`}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#394351] bg-[#1f252d] p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-lg font-bold text-[#f1f1ed]">
              Collect your own badges
            </h2>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Scan the QR codes at Lyfter talks and stands, earn XP, and build
              your own collection.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
            >
              Create an account
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
