ALTER TYPE "ProcessCadence" ADD VALUE 'DAILY';
ALTER TYPE "ProcessCadence" ADD VALUE 'BIWEEKLY';
ALTER TYPE "ProcessCadence" ADD VALUE 'QUARTERLY';
ALTER TYPE "ProcessCadence" ADD VALUE 'YEARLY';
ALTER TYPE "ProcessCadence" ADD VALUE 'CUSTOM';

CREATE TYPE "ProcessCustomUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');
CREATE TYPE "ProcessTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "process_templates" ADD COLUMN "customEvery" INTEGER;
ALTER TABLE "process_templates" ADD COLUMN "customUnit" "ProcessCustomUnit";
ALTER TABLE "process_templates" ADD COLUMN "status" "ProcessTemplateStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "process_templates" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "process_templates" ALTER COLUMN "cadence" SET DEFAULT 'ONCE';
ALTER TABLE "process_templates" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

UPDATE "process_templates" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;

ALTER TABLE "work_items" ADD COLUMN "processSchedule" TEXT;
