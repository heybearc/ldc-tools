ALTER TYPE "WorkTimingKind" ADD VALUE 'CREW_REQUEST';

ALTER TABLE "work_items" ADD COLUMN "importKey" TEXT;

CREATE UNIQUE INDEX "work_items_constructionGroupId_importKey_key" ON "work_items"("constructionGroupId", "importKey");
