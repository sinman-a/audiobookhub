-- Migration: Admin Content Ingestion module
-- Idempotent: safe to run multiple times.

-- 1. Create AudiobookStatus enum
DO $$ BEGIN
  CREATE TYPE "AudiobookStatus" AS ENUM ('Draft', 'Review', 'Published', 'Unavailable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create PermissionStatus enum
DO $$ BEGIN
  CREATE TYPE "PermissionStatus" AS ENUM ('unknown', 'allowed', 'pending', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add status column (nullable first for safe backfill)
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "status" "AudiobookStatus";

-- 4. Backfill from isPublished (only if isPublished column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Audiobook' AND column_name = 'isPublished'
  ) THEN
    UPDATE "Audiobook"
    SET "status" = CASE
      WHEN "isPublished" = true THEN 'Published'::"AudiobookStatus"
      ELSE 'Draft'::"AudiobookStatus"
    END
    WHERE "status" IS NULL;
  ELSE
    UPDATE "Audiobook" SET "status" = 'Draft'::"AudiobookStatus" WHERE "status" IS NULL;
  END IF;
END $$;

-- 5. Set NOT NULL + default on status
ALTER TABLE "Audiobook" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Audiobook" ALTER COLUMN "status" SET DEFAULT 'Draft';

-- 6. Drop isPublished (idempotent)
ALTER TABLE "Audiobook" DROP COLUMN IF EXISTS "isPublished";

-- 7. Nullify duplicate youtubeIds before adding UNIQUE constraint
UPDATE "Audiobook" a
SET "youtubeId" = NULL
WHERE "youtubeId" IS NOT NULL AND EXISTS (
  SELECT 1 FROM "Audiobook" b
  WHERE b."youtubeId" = a."youtubeId"
    AND b."id" <> a."id"
    AND b."createdAt" > a."createdAt"
);

-- Add UNIQUE constraint (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Audiobook_youtubeId_key'
  ) THEN
    ALTER TABLE "Audiobook" ADD CONSTRAINT "Audiobook_youtubeId_key" UNIQUE ("youtubeId");
  END IF;
END $$;

-- Make youtubeId nullable (idempotent — no-op if already nullable)
ALTER TABLE "Audiobook" ALTER COLUMN "youtubeId" DROP NOT NULL;

-- 8. Add new Audiobook columns
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "sourceUrl"        TEXT;
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "channelId"        TEXT;
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "rightsHolder"     TEXT;
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "permissionStatus" "PermissionStatus" NOT NULL DEFAULT 'unknown';
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "chapters"         JSONB;
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "lastCheckedAt"    TIMESTAMP(3);

-- 9. Create IngestionLog table
CREATE TABLE IF NOT EXISTS "IngestionLog" (
  "id"        TEXT         NOT NULL,
  "videoId"   TEXT         NOT NULL,
  "bookId"    TEXT,
  "action"    TEXT         NOT NULL,
  "message"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);
