import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Global level thresholds. XP is cumulative across every event, so these
// numbers are the only cached progression state in the app.
const levels = [
  { level: 1, name: "Newcomer", minXp: 0 },
  { level: 2, name: "Regular", minXp: 100 },
  { level: 3, name: "Insider", minXp: 250 },
  { level: 4, name: "Connector", minXp: 450 },
  { level: 5, name: "Ambassador", minXp: 700 },
  { level: 6, name: "Legend", minXp: 1000 },
];

// Demo-only credentials. Seeding a user without an `Account` row leaves them
// unable to sign in, which would make the admin panel untestable. Better Auth
// stores email/password accounts under providerId "credential".
const DEMO_PASSWORD = "lyfter-demo-2026";

async function upsertCredentialAccount(userId: string) {
  const password = await hashPassword(DEMO_PASSWORD);

  await prisma.account.upsert({
    where: { id: `${userId}-credential` },
    update: { password, userId, accountId: userId },
    create: {
      id: `${userId}-credential`,
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    },
  });
}

interface DemoBadgeSeed {
  eventId: string;
  qrToken: string;
  name: string;
  description: string;
  xpValue: number;
  room: string;
  type: "TALK" | "STAND" | "WELCOME";
  rarity: "COMMON" | "RARE" | "LIMITED";
  iconKey: string;
}

async function upsertDemoBadge(input: DemoBadgeSeed) {
  const existingToken = await prisma.qrToken.findUnique({
    where: { token: input.qrToken },
    select: {
      eventId: true,
      eventBadge: { select: { id: true, badgeId: true } },
    },
  });

  if (existingToken?.eventId === input.eventId && existingToken.eventBadge) {
    const { id: eventBadgeId, badgeId } = existingToken.eventBadge;
    const conflicting = await prisma.badge.findUnique({
      where: { name: input.name },
      select: { id: true },
    });

    if (conflicting && conflicting.id !== badgeId) {
      const usage = await prisma.eventBadge.count({
        where: { badgeId: conflicting.id },
      });

      if (usage === 0) {
        await prisma.badge.delete({ where: { id: conflicting.id } });
      }
    }

    await prisma.badge.update({
      where: { id: badgeId },
      data: {
        name: input.name,
        description: input.description,
        xpValue: input.xpValue,
        type: input.type,
        rarity: input.rarity,
        iconKey: input.iconKey,
      },
    });

    await prisma.eventBadge.update({
      where: { id: eventBadgeId },
      data: { room: input.room },
    });

    return { badgeId, eventBadgeId };
  }

  const badge = await prisma.badge.upsert({
    where: { name: input.name },
    update: {
      description: input.description,
      xpValue: input.xpValue,
      type: input.type,
      rarity: input.rarity,
      iconKey: input.iconKey,
    },
    create: {
      name: input.name,
      description: input.description,
      xpValue: input.xpValue,
      type: input.type,
      rarity: input.rarity,
      iconKey: input.iconKey,
    },
  });

  const eventBadge = await prisma.eventBadge.upsert({
    where: {
      eventId_badgeId: { eventId: input.eventId, badgeId: badge.id },
    },
    update: { room: input.room },
    create: {
      eventId: input.eventId,
      badgeId: badge.id,
      room: input.room,
    },
  });

  return { badgeId: badge.id, eventBadgeId: eventBadge.id };
}

async function main() {
  for (const level of levels) {
    await prisma.level.upsert({
      where: { level: level.level },
      update: { name: level.name, minXp: level.minXp },
      create: level,
    });
  }

  console.log(`Seeded ${levels.length} levels.`);

  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log("Demo data skipped (set SEED_DEMO_DATA=true to seed it).");
    return;
  }

  await prisma.user.upsert({
    where: { id: "demo-organizer" },
    update: {
      name: "Lyfter Demo",
      email: "organizer@lyfter.demo",
      emailVerified: true,
      role: "ADMIN",
    },
    create: {
      id: "demo-organizer",
      name: "Lyfter Demo",
      email: "organizer@lyfter.demo",
      emailVerified: true,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { id: "demo-super-admin" },
    update: {
      name: "Platform Owner",
      email: "superadmin@lyfter.demo",
      emailVerified: true,
      role: "SUPER_ADMIN",
    },
    create: {
      id: "demo-super-admin",
      name: "Platform Owner",
      email: "superadmin@lyfter.demo",
      emailVerified: true,
      role: "SUPER_ADMIN",
    },
  });

  // A partner owns one stand in the demo event: the Supabase stand. The
  // relation lives on EventBadge, so a partner can never see the whole event.
  await prisma.user.upsert({
    where: { id: "demo-partner" },
    update: {
      name: "Supabase Partner",
      email: "partner@lyfter.demo",
      emailVerified: true,
      role: "ADMIN",
    },
    create: {
      id: "demo-partner",
      name: "Supabase Partner",
      email: "partner@lyfter.demo",
      emailVerified: true,
      role: "ADMIN",
    },
  });

  await upsertCredentialAccount("demo-organizer");
  await upsertCredentialAccount("demo-partner");
  await upsertCredentialAccount("demo-super-admin");

  // A company groups the events an ADMIN can manage. The demo organizer is a
  // member of this company; stand access is still scoped by EventBadge.
  const company = await prisma.company.upsert({
    where: { slug: "lyfter-demo" },
    update: { name: "Lyfter Demo" },
    create: {
      id: "demo-company",
      name: "Lyfter Demo",
      slug: "lyfter-demo",
      description: "The company behind the Lyfter demo event.",
    },
  });

  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: "demo-organizer",
      },
    },
    update: {},
    create: {
      id: `demo-company-member-organizer`,
      companyId: company.id,
      userId: "demo-organizer",
    },
  });

  // Dates are stored in UTC. With America/Costa_Rica (UTC-6) they render at
  // the local times documented for the demo.
  const event = await prisma.event.upsert({
    where: { slug: "demo-2026" },
    update: {
      name: "Lyfter Demo Costa Rica 2026",
      description: "Evento de demostración para desarrollo local.",
      location: "San José",
      country: "Costa Rica",
      mode: "IN_PERSON",
      status: "ACTIVE",
      startsAt: new Date("2026-11-20T16:00:00.000Z"),
      endsAt: new Date("2026-11-20T22:00:00.000Z"),
      organizerId: "demo-organizer",
      companyId: company.id,
    },
    create: {
      name: "Lyfter Demo Costa Rica 2026",
      description: "Evento de demostración para desarrollo local.",
      location: "San José",
      country: "Costa Rica",
      mode: "IN_PERSON",
      status: "ACTIVE",
      startsAt: new Date("2026-11-20T16:00:00.000Z"),
      endsAt: new Date("2026-11-20T22:00:00.000Z"),
      organizerId: "demo-organizer",
      companyId: company.id,
      slug: "demo-2026",
    },
  });

  const galleryCount = await prisma.eventImage.count({
    where: { eventId: event.id },
  });

  if (galleryCount === 0) {
    await prisma.eventImage.createMany({
      data: [
        {
          eventId: event.id,
          url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          alt: "Asistentes en el escenario principal de Lyfter Demo Costa Rica 2026",
          sortOrder: 0,
        },
        {
          eventId: event.id,
          url: "https://images.unsplash.com/photo-1511578314322-379afb476865",
          alt: "Área de networking durante el evento demo",
          sortOrder: 1,
        },
      ],
    });
  }

  const demoBadges = [
    {
      name: "Charla inaugural",
      description: "Charla de apertura sobre el estado de la plataforma.",
      xpValue: 50,
      room: "Escenario principal",
      qrToken: "demo-keynote",
      type: "TALK",
      rarity: "COMMON",
      iconKey: "mic",
    },
    {
      name: "React Server Components",
      description: "Análisis del modelo de renderizado server-first.",
      xpValue: 60,
      room: "Sala A",
      qrToken: "demo-rsc",
      type: "TALK",
      rarity: "COMMON",
      iconKey: "code",
    },
    {
      name: "Stand de Supabase",
      description: "Conocé al equipo de Supabase en su stand.",
      xpValue: 40,
      room: "Stand 3",
      qrToken: "demo-supabase",
      type: "STAND",
      rarity: "RARE",
      iconKey: "database",
    },
    {
      name: "Taller de Better Auth",
      description: "Taller práctico de autenticación.",
      xpValue: 70,
      room: "Sala B",
      qrToken: "demo-auth",
      type: "TALK",
      rarity: "LIMITED",
      iconKey: "shield",
    },
  ] as const;

  const tokenIds: Record<string, string> = {};
  const tokenXp: Record<string, number> = {};
  const eventBadgeIds: Record<string, string> = {};

  for (const demoBadge of demoBadges) {
    const { eventBadgeId } = await upsertDemoBadge({
      eventId: event.id,
      ...demoBadge,
    });

    eventBadgeIds[demoBadge.qrToken] = eventBadgeId;

    await prisma.qrToken.upsert({
      where: { token: demoBadge.qrToken },
      update: {
        kind: "BADGE",
        eventId: event.id,
        eventBadgeId,
        active: true,
      },
      create: {
        token: demoBadge.qrToken,
        kind: "BADGE",
        eventId: event.id,
        eventBadgeId,
        active: true,
      },
    });

    const token = await prisma.qrToken.findUnique({
      where: { token: demoBadge.qrToken },
      select: { id: true },
    });

    if (token) {
      tokenIds[demoBadge.qrToken] = token.id;
      tokenXp[demoBadge.qrToken] = demoBadge.xpValue;
    }
  }

  const supabaseStandId = eventBadgeIds["demo-supabase"];

  if (supabaseStandId) {
    await prisma.eventBadge.update({
      where: { id: supabaseStandId },
      data: { partnerId: "demo-partner" },
    });
  }

  await prisma.qrToken.upsert({
    where: { token: "demo-welcome" },
    update: {
      kind: "WELCOME",
      eventId: event.id,
      eventBadgeId: null,
      active: true,
    },
    create: {
      token: "demo-welcome",
      kind: "WELCOME",
      eventId: event.id,
      eventBadgeId: null,
      active: true,
    },
  });

  await prisma.prize.upsert({
    where: { eventId: event.id },
    update: {
      name: "Kit de Lyfter",
      description: "Completá todas las insignias para desbloquearlo.",
      requiredBadgesCount: 4,
      revealedAt: null,
    },
    create: {
      eventId: event.id,
      name: "Kit de Lyfter",
      description: "Completá todas las insignias para desbloquearlo.",
      requiredBadgesCount: 4,
      revealedAt: null,
    },
  });

  console.log('Seeded demo event "Lyfter Demo Costa Rica 2026" with 5 QR tokens.');

  // Demo attendees with different XP totals, so the leaderboard has a real
  // ranking to show instead of a single row. Ada keeps a partial collection
  // (2 of 4 badges, 110 XP) and Ema completes the whole set, which unlocks
  // the prize.
  const demoAttendees = [
    {
      id: "demo-attendee",
      name: "Ada Attendee",
      email: "attendee@lyfter.demo",
      tokens: ["demo-keynote", "demo-rsc"],
    },
    {
      id: "demo-attendee-2",
      name: "Bruno Builder",
      email: "builder@lyfter.demo",
      tokens: ["demo-keynote", "demo-rsc", "demo-supabase"],
    },
    {
      id: "demo-attendee-3",
      name: "Carla Coder",
      email: "coder@lyfter.demo",
      tokens: ["demo-keynote", "demo-auth"],
    },
    {
      id: "demo-attendee-4",
      name: "Dani Dev",
      email: "dev@lyfter.demo",
      tokens: ["demo-keynote"],
    },
    {
      id: "demo-attendee-5",
      name: "Ema Event",
      email: "ema@lyfter.demo",
      tokens: ["demo-keynote", "demo-rsc", "demo-supabase", "demo-auth"],
    },
  ];

  for (const attendee of demoAttendees) {
    await prisma.user.upsert({
      where: { id: attendee.id },
      update: {
        name: attendee.name,
        email: attendee.email,
        emailVerified: true,
        role: "ATTENDEE",
      },
      create: {
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        emailVerified: true,
        role: "ATTENDEE",
      },
    });

    await prisma.registration.upsert({
      where: {
        userId_eventId: { userId: attendee.id, eventId: event.id },
      },
      update: {},
      create: { userId: attendee.id, eventId: event.id },
    });

    for (const token of attendee.tokens) {
      const qrTokenId = tokenIds[token];
      const xpAwarded = tokenXp[token];
      const eventBadgeId = eventBadgeIds[token];

      if (!qrTokenId || xpAwarded === undefined || !eventBadgeId) {
        continue;
      }

      await prisma.scan.upsert({
        where: {
          userId_qrTokenId: { userId: attendee.id, qrTokenId },
        },
        update: { xpAwarded, eventBadgeId },
        create: {
          userId: attendee.id,
          qrTokenId,
          eventBadgeId,
          eventId: event.id,
          xpAwarded,
        },
      });
    }
  }

  console.log(
    `Seeded ${demoAttendees.length} demo attendees with different XP totals.`,
  );

  // A second event whose prize the organizer already announced. It exists so
  // every prize state is reachable in the demo data: locked (event 1, partial
  // collection), earned (event 1, complete collection) and announced (event 2,
  // visible to everyone but not earned yet).
  const meetup = await prisma.event.upsert({
    where: { slug: "meetup-2026" },
    update: {
      name: "Lyfter Meetup Costa Rica 2026",
      description: "Meetup más pequeño con un premio ya anunciado.",
      location: "Escazú",
      country: "Costa Rica",
      mode: "HYBRID",
      status: "ACTIVE",
      startsAt: new Date("2026-12-04T17:00:00.000Z"),
      endsAt: new Date("2026-12-04T23:00:00.000Z"),
      organizerId: "demo-organizer",
    },
    create: {
      name: "Lyfter Meetup Costa Rica 2026",
      description: "Meetup más pequeño con un premio ya anunciado.",
      location: "Escazú",
      country: "Costa Rica",
      mode: "HYBRID",
      status: "ACTIVE",
      startsAt: new Date("2026-12-04T17:00:00.000Z"),
      endsAt: new Date("2026-12-04T23:00:00.000Z"),
      organizerId: "demo-organizer",
      slug: "meetup-2026",
    },
  });

  const meetupBadges = [
    {
      name: "Registro del meetup",
      description: "Insignia de bienvenida por asistir al meetup.",
      xpValue: 20,
      room: "Recepción",
      qrToken: "demo-meetup-checkin",
      type: "WELCOME",
      rarity: "COMMON",
      iconKey: "ticket",
    },
    {
      name: "Charlas relámpago",
      description: "Insignia por participar en las charlas relámpago.",
      xpValue: 30,
      room: "Sala C",
      qrToken: "demo-meetup-talks",
      type: "TALK",
      rarity: "COMMON",
      iconKey: "zap",
    },
  ] as const;

  const meetupTokenIds: Record<string, string> = {};
  const meetupTokenXp: Record<string, number> = {};
  const meetupEventBadgeIds: Record<string, string> = {};

  for (const meetupBadge of meetupBadges) {
    const { eventBadgeId } = await upsertDemoBadge({
      eventId: meetup.id,
      ...meetupBadge,
    });

    await prisma.qrToken.upsert({
      where: { token: meetupBadge.qrToken },
      update: {
        kind: "BADGE",
        eventId: meetup.id,
        eventBadgeId,
        active: true,
      },
      create: {
        token: meetupBadge.qrToken,
        kind: "BADGE",
        eventId: meetup.id,
        eventBadgeId,
        active: true,
      },
    });

    const token = await prisma.qrToken.findUnique({
      where: { token: meetupBadge.qrToken },
      select: { id: true },
    });

    if (token) {
      meetupTokenIds[meetupBadge.qrToken] = token.id;
      meetupTokenXp[meetupBadge.qrToken] = meetupBadge.xpValue;
      meetupEventBadgeIds[meetupBadge.qrToken] = eventBadgeId;
    }
  }

  await prisma.qrToken.upsert({
    where: { token: "demo-meetup-welcome" },
    update: {
      kind: "WELCOME",
      eventId: meetup.id,
      eventBadgeId: null,
      active: true,
    },
    create: {
      token: "demo-meetup-welcome",
      kind: "WELCOME",
      eventId: meetup.id,
      eventBadgeId: null,
      active: true,
    },
  });

  await prisma.prize.upsert({
    where: { eventId: meetup.id },
    update: {
      name: "Café y pegatinas",
      description: "Conseguí ambas insignias del meetup para ganarlo.",
      requiredBadgesCount: 2,
      revealedAt: new Date("2026-11-27T16:00:00.000Z"),
    },
    create: {
      eventId: meetup.id,
      name: "Café y pegatinas",
      description: "Conseguí ambas insignias del meetup para ganarlo.",
      requiredBadgesCount: 2,
      revealedAt: new Date("2026-11-27T16:00:00.000Z"),
    },
  });

  // Ada joins the meetup and collects one of the two badges: the prize is
  // announced to her, but she has not earned it yet.
  await prisma.registration.upsert({
    where: { userId_eventId: { userId: "demo-attendee", eventId: meetup.id } },
    update: {},
    create: { userId: "demo-attendee", eventId: meetup.id },
  });

  const meetupTokenId = meetupTokenIds["demo-meetup-checkin"];
  const meetupXp = meetupTokenXp["demo-meetup-checkin"];
  const meetupEventBadgeId = meetupEventBadgeIds["demo-meetup-checkin"];

  if (meetupTokenId && meetupXp !== undefined && meetupEventBadgeId) {
    await prisma.scan.upsert({
      where: {
        userId_qrTokenId: { userId: "demo-attendee", qrTokenId: meetupTokenId },
      },
      update: { xpAwarded: meetupXp, eventBadgeId: meetupEventBadgeId },
      create: {
        userId: "demo-attendee",
        qrTokenId: meetupTokenId,
        eventBadgeId: meetupEventBadgeId,
        eventId: meetup.id,
        xpAwarded: meetupXp,
      },
    });
  }

  console.log(
    'Seeded demo event "Lyfter Meetup Costa Rica 2026" with an announced prize.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
