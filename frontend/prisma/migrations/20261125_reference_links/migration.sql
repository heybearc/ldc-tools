CREATE TABLE "reference_links" (
    "id" TEXT NOT NULL,
    "constructionGroupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reference_links_constructionGroupId_idx" ON "reference_links"("constructionGroupId");

ALTER TABLE "reference_links" ADD CONSTRAINT "reference_links_constructionGroupId_fkey" FOREIGN KEY ("constructionGroupId") REFERENCES "construction_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reference_links" ADD CONSTRAINT "reference_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
