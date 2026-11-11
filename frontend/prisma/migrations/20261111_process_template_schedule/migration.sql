CREATE TYPE "ProcessAppliesTo" AS ENUM ('TEAM', 'PROJECT');
CREATE TYPE "ProcessCadence" AS ENUM ('ONCE', 'WEEKLY', 'MONTHLY');

ALTER TABLE "process_templates" ADD COLUMN "purpose" TEXT;
ALTER TABLE "process_templates" ADD COLUMN "appliesTo" "ProcessAppliesTo" NOT NULL DEFAULT 'TEAM';
ALTER TABLE "process_templates" ADD COLUMN "cadence" "ProcessCadence" NOT NULL DEFAULT 'MONTHLY';

ALTER TABLE "work_items" ADD COLUMN "processCadence" "ProcessCadence";
