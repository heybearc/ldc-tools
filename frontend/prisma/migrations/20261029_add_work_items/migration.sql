CREATE TYPE "WorkTimingKind" AS ENUM ('DEADLINE', 'PROJECT_DATE', 'MONTHLY', 'YEARLY');

CREATE TYPE "WorkStatus" AS ENUM ('OPEN', 'DONE');

CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "constructionGroupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "explanation" TEXT,
    "referenceUrl" TEXT,
    "timingKind" "WorkTimingKind" NOT NULL,
    "dueOn" TIMESTAMP(3),
    "projectId" TEXT,
    "claimable" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'OPEN',
    "requestorName" TEXT,
    "requestorEmail" TEXT,
    "createdById" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_items_constructionGroupId_idx" ON "work_items"("constructionGroupId");
CREATE INDEX "work_items_status_idx" ON "work_items"("status");
CREATE INDEX "work_items_assigneeId_idx" ON "work_items"("assigneeId");

ALTER TABLE "work_items" ADD CONSTRAINT "work_items_constructionGroupId_fkey" FOREIGN KEY ("constructionGroupId") REFERENCES "construction_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
