ALTER TABLE "work_notes" ADD COLUMN "parentId" TEXT;

CREATE INDEX "work_notes_parentId_idx" ON "work_notes"("parentId");

ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "work_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "work_help_reads" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_help_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "work_help_reads_workItemId_userId_key" ON "work_help_reads"("workItemId", "userId");
CREATE INDEX "work_help_reads_userId_idx" ON "work_help_reads"("userId");

ALTER TABLE "work_help_reads" ADD CONSTRAINT "work_help_reads_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_help_reads" ADD CONSTRAINT "work_help_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
