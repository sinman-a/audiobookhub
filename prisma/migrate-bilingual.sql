-- Migration: bilingual categories/subcategories/genres
-- Copies existing name -> nameUk, adds nameEn, creates Subcategory table
-- Adds categoryId + subcategoryId to Audiobook
-- Safe to run multiple times (idempotent)

-- ── 1. Category: add nameEn ─────────────────────────────────────────────────
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT NOT NULL DEFAULT '';

-- ── 2. Category: add nameUk (copy from name), make NOT NULL + UNIQUE ─────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Category' AND column_name = 'nameUk'
  ) THEN
    ALTER TABLE "Category" ADD COLUMN "nameUk" TEXT;
    UPDATE "Category" SET "nameUk" = "name";
    ALTER TABLE "Category" ALTER COLUMN "nameUk" SET NOT NULL;
    ALTER TABLE "Category" ADD CONSTRAINT "Category_nameUk_key" UNIQUE ("nameUk");
  END IF;
END $$;

-- ── 3. Category: drop old name column ────────────────────────────────────────
ALTER TABLE "Category" DROP COLUMN IF EXISTS "name";

-- ── 4. Genre: add nameEn ─────────────────────────────────────────────────────
ALTER TABLE "Genre" ADD COLUMN IF NOT EXISTS "nameEn" TEXT NOT NULL DEFAULT '';

-- ── 5. Genre: add nameUk (copy from name), make NOT NULL + UNIQUE ────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Genre' AND column_name = 'nameUk'
  ) THEN
    ALTER TABLE "Genre" ADD COLUMN "nameUk" TEXT;
    UPDATE "Genre" SET "nameUk" = "name";
    ALTER TABLE "Genre" ALTER COLUMN "nameUk" SET NOT NULL;
    ALTER TABLE "Genre" ADD CONSTRAINT "Genre_nameUk_key" UNIQUE ("nameUk");
  END IF;
END $$;

-- ── 6. Genre: drop old name column ───────────────────────────────────────────
ALTER TABLE "Genre" DROP COLUMN IF EXISTS "name";

-- ── 7. Create Subcategory table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Subcategory" (
  "id"         TEXT         NOT NULL,
  "nameUk"     TEXT         NOT NULL,
  "nameEn"     TEXT         NOT NULL DEFAULT '',
  "categoryId" TEXT         NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subcategory_nameUk_categoryId_key" UNIQUE ("nameUk", "categoryId")
);

-- ── 8. Subcategory: FK to Category (CASCADE) ─────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Subcategory_categoryId_fkey'
  ) THEN
    ALTER TABLE "Subcategory"
      ADD CONSTRAINT "Subcategory_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 9. Genre: add subcategoryId (nullable FK to Subcategory) ─────────────────
ALTER TABLE "Genre" ADD COLUMN IF NOT EXISTS "subcategoryId" TEXT;

-- ── 10. Genre: drop old FK constraint on categoryId ──────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Genre_categoryId_fkey') THEN
    ALTER TABLE "Genre" DROP CONSTRAINT "Genre_categoryId_fkey";
  END IF;
END $$;

-- ── 11. Genre: drop old categoryId column ────────────────────────────────────
ALTER TABLE "Genre" DROP COLUMN IF EXISTS "categoryId";

-- ── 12. Genre: FK subcategoryId -> Subcategory (SET NULL) ────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Genre_subcategoryId_fkey'
  ) THEN
    ALTER TABLE "Genre"
      ADD CONSTRAINT "Genre_subcategoryId_fkey"
      FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 13. Audiobook: add categoryId (nullable FK to Category, SET NULL) ─────────
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Audiobook_categoryId_fkey'
  ) THEN
    ALTER TABLE "Audiobook"
      ADD CONSTRAINT "Audiobook_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 14. Audiobook: add subcategoryId (nullable FK to Subcategory, SET NULL) ───
ALTER TABLE "Audiobook" ADD COLUMN IF NOT EXISTS "subcategoryId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Audiobook_subcategoryId_fkey'
  ) THEN
    ALTER TABLE "Audiobook"
      ADD CONSTRAINT "Audiobook_subcategoryId_fkey"
      FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
