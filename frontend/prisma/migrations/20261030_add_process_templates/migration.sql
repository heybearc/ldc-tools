ALTER TYPE "WorkTimingKind" ADD VALUE 'PROCESS';

CREATE TABLE "process_templates" (
    "id" TEXT NOT NULL,
    "constructionGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "process_steps" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "explanation" TEXT,
    "referenceUrl" TEXT,

    CONSTRAINT "process_steps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "process_templates_constructionGroupId_idx" ON "process_templates"("constructionGroupId");
CREATE INDEX "process_steps_templateId_idx" ON "process_steps"("templateId");

ALTER TABLE "process_templates" ADD CONSTRAINT "process_templates_constructionGroupId_fkey" FOREIGN KEY ("constructionGroupId") REFERENCES "construction_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "process_templates" ADD CONSTRAINT "process_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
