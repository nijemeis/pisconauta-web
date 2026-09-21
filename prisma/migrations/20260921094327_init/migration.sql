-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('enthusiast', 'producer', 'admin');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'editor');

-- CreateEnum
CREATE TYPE "ProducerStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "PiscoStyle" AS ENUM ('puro', 'acholado', 'mosto_verde');

-- CreateEnum
CREATE TYPE "StillType" AS ENUM ('falca', 'alambique_cobre', 'otro');

-- CreateEnum
CREATE TYPE "PiscoStatus" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('bottle', 'label', 'lifestyle', 'cover');

-- CreateEnum
CREATE TYPE "NoteFamily" AS ENUM ('fruta', 'floral', 'herbal', 'especia', 'mineral', 'dulce');

-- CreateEnum
CREATE TYPE "NoteSource" AS ENUM ('producer', 'community');

-- CreateEnum
CREATE TYPE "FlavourAxis" AS ENUM ('cuerpo', 'dulzor', 'herbal', 'citrico', 'floral', 'alcohol');

-- CreateEnum
CREATE TYPE "AwardLevel" AS ENUM ('gran_oro', 'oro', 'plata', 'bronce');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('visible', 'flagged', 'removed');

-- CreateEnum
CREATE TYPE "CellarState" AS ENUM ('tasted', 'wishlist');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "oauthProvider" TEXT,
    "oauthSubject" TEXT,
    "displayName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es-PE',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "role" "UserRole" NOT NULL DEFAULT 'enthusiast',
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valleys" JSONB NOT NULL DEFAULT '[]',
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variety" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aromatic" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Variety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "foundedYear" INTEGER,
    "regionId" TEXT,
    "valley" TEXT,
    "description" TEXT,
    "history" TEXT,
    "visitInfo" TEXT,
    "crestInitials" TEXT,
    "coverPhotoKey" TEXT,
    "website" TEXT,
    "ruc" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "ProducerStatus" NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "avgRating" DECIMAL(3,2),
    "piscoCount" INTEGER NOT NULL DEFAULT 0,
    "medalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducerMember" (
    "producerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'owner',

    CONSTRAINT "ProducerMember_pkey" PRIMARY KEY ("producerId","userId")
);

-- CreateTable
CREATE TABLE "Pisco" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "style" "PiscoStyle",
    "regionId" TEXT,
    "valley" TEXT,
    "vintage" INTEGER,
    "abvPct" DECIMAL(4,1),
    "bottleSizeMl" INTEGER,
    "restMonths" INTEGER,
    "stillType" "StillType",
    "distillations" INTEGER,
    "description" TEXT,
    "status" "PiscoStatus" NOT NULL DEFAULT 'draft',
    "reviewNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "avgRating" DECIMAL(3,2),
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "minPriceCents" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pisco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiscoVariety" (
    "piscoId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "sharePct" INTEGER,

    CONSTRAINT "PiscoVariety_pkey" PRIMARY KEY ("piscoId","varietyId")
);

-- CreateTable
CREATE TABLE "PiscoPhoto" (
    "id" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL DEFAULT 'bottle',
    "width" INTEGER,
    "height" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "phash" TEXT,

    CONSTRAINT "PiscoPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TastingNoteTerm" (
    "id" TEXT NOT NULL,
    "termEs" TEXT NOT NULL,
    "termEn" TEXT NOT NULL,
    "family" "NoteFamily" NOT NULL,

    CONSTRAINT "TastingNoteTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiscoTastingNote" (
    "piscoId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "addedBy" "NoteSource" NOT NULL DEFAULT 'producer',
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PiscoTastingNote_pkey" PRIMARY KEY ("piscoId","termId")
);

-- CreateTable
CREATE TABLE "FlavourProfile" (
    "piscoId" TEXT NOT NULL,
    "axis" "FlavourAxis" NOT NULL,
    "value" DECIMAL(2,1) NOT NULL,
    "communityValue" DECIMAL(2,1),

    CONSTRAINT "FlavourProfile_pkey" PRIMARY KEY ("piscoId","axis")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "level" "AwardLevel" NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceUrl" TEXT,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retailer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PE',

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListing" (
    "id" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "url" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score10" INTEGER NOT NULL,
    "body" TEXT,
    "noteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoKey" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellarEntry" (
    "userId" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "state" "CellarState" NOT NULL,
    "personalScore10" INTEGER,
    "tastedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CellarEntry_pkey" PRIMARY KEY ("userId","piscoId")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListItem" (
    "listId" TEXT NOT NULL,
    "piscoId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("listId","piscoId")
);

-- CreateTable
CREATE TABLE "LabelScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "storageKey" TEXT,
    "phash" TEXT,
    "ocrText" TEXT,
    "matchedPiscoId" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "producerName" TEXT,
    "photoKey" TEXT,
    "note" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BottleSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthProvider_oauthSubject_key" ON "User"("oauthProvider", "oauthSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Variety_slug_key" ON "Variety"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variety_name_key" ON "Variety"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_slug_key" ON "Producer"("slug");

-- CreateIndex
CREATE INDEX "Producer_regionId_idx" ON "Producer"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Pisco_slug_key" ON "Pisco"("slug");

-- CreateIndex
CREATE INDEX "Pisco_producerId_idx" ON "Pisco"("producerId");

-- CreateIndex
CREATE INDEX "Pisco_status_style_idx" ON "Pisco"("status", "style");

-- CreateIndex
CREATE INDEX "Pisco_status_regionId_idx" ON "Pisco"("status", "regionId");

-- CreateIndex
CREATE INDEX "Pisco_status_avgRating_idx" ON "Pisco"("status", "avgRating");

-- CreateIndex
CREATE INDEX "PiscoVariety_varietyId_idx" ON "PiscoVariety"("varietyId");

-- CreateIndex
CREATE INDEX "PiscoPhoto_piscoId_idx" ON "PiscoPhoto"("piscoId");

-- CreateIndex
CREATE UNIQUE INDEX "TastingNoteTerm_termEs_key" ON "TastingNoteTerm"("termEs");

-- CreateIndex
CREATE INDEX "Award_piscoId_idx" ON "Award"("piscoId");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_name_key" ON "Retailer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListing_piscoId_retailerId_key" ON "PriceListing"("piscoId", "retailerId");

-- CreateIndex
CREATE INDEX "Review_piscoId_status_idx" ON "Review"("piscoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_piscoId_userId_key" ON "Review"("piscoId", "userId");

-- CreateIndex
CREATE INDEX "CellarEntry_userId_state_idx" ON "CellarEntry"("userId", "state");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerMember" ADD CONSTRAINT "ProducerMember_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerMember" ADD CONSTRAINT "ProducerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pisco" ADD CONSTRAINT "Pisco_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pisco" ADD CONSTRAINT "Pisco_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiscoVariety" ADD CONSTRAINT "PiscoVariety_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiscoVariety" ADD CONSTRAINT "PiscoVariety_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "Variety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiscoPhoto" ADD CONSTRAINT "PiscoPhoto_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiscoTastingNote" ADD CONSTRAINT "PiscoTastingNote_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiscoTastingNote" ADD CONSTRAINT "PiscoTastingNote_termId_fkey" FOREIGN KEY ("termId") REFERENCES "TastingNoteTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlavourProfile" ADD CONSTRAINT "FlavourProfile_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListing" ADD CONSTRAINT "PriceListing_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListing" ADD CONSTRAINT "PriceListing_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellarEntry" ADD CONSTRAINT "CellarEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellarEntry" ADD CONSTRAINT "CellarEntry_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_piscoId_fkey" FOREIGN KEY ("piscoId") REFERENCES "Pisco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelScan" ADD CONSTRAINT "LabelScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelScan" ADD CONSTRAINT "LabelScan_matchedPiscoId_fkey" FOREIGN KEY ("matchedPiscoId") REFERENCES "Pisco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Search: accent-insensitive trigram index over the denormalised search text.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE INDEX "Pisco_searchText_trgm" ON "Pisco" USING gin (f_unaccent(lower("searchText")) gin_trgm_ops);
