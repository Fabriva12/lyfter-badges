-- Badge configuration is per event: the catalog keeps the shared name and
-- image, while XP, description, taxonomy and icon live on each EventBadge.

ALTER TABLE "EventBadge"
    ADD COLUMN "description" TEXT,
    ADD COLUMN "xpValue" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "iconKey" TEXT,
    ADD COLUMN "type" "BadgeType" NOT NULL DEFAULT 'TALK',
    ADD COLUMN "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMMON';

-- Preserve the current configuration of every enabled badge before dropping
-- the shared columns.
UPDATE "EventBadge" AS eb
SET "description" = b."description",
    "xpValue" = b."xpValue",
    "iconKey" = b."iconKey",
    "type" = b."type",
    "rarity" = b."rarity"
FROM "Badge" AS b
WHERE eb."badgeId" = b."id";

ALTER TABLE "EventBadge" ALTER COLUMN "xpValue" DROP DEFAULT;

ALTER TABLE "Badge"
    DROP COLUMN "description",
    DROP COLUMN "xpValue",
    DROP COLUMN "iconKey",
    DROP COLUMN "type",
    DROP COLUMN "rarity";
