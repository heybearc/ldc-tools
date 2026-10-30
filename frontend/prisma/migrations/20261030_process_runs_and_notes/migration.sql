CREATE TYPE "WorkNoteKind" AS ENUM ('NOTE', 'HELP');

ALTER TABLE "work_items" ADD COLUMN "processTemplateId" TEXT;

CREATE TABLE "work_item_steps" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "explanation" TEXT,
    "referenceUrl" TEXT,

    CONSTRAINT "work_item_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_notes" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" "WorkNoteKind" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_items_processTemplateId_idx" ON "work_items"("processTemplateId");
CREATE INDEX "work_item_steps_workItemId_idx" ON "work_item_steps"("workItemId");
CREATE INDEX "work_notes_workItemId_idx" ON "work_notes"("workItemId");

ALTER TABLE "work_items" ADD CONSTRAINT "work_items_processTemplateId_fkey" FOREIGN KEY ("processTemplateId") REFERENCES "process_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_item_steps" ADD CONSTRAINT "work_item_steps_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
