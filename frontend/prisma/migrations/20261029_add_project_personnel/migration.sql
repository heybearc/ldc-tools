CREATE TABLE "project_personnel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_personnel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_personnel_projectId_userId_key" ON "project_personnel"("projectId", "userId");
CREATE INDEX "project_personnel_userId_idx" ON "project_personnel"("userId");

ALTER TABLE "project_personnel" ADD CONSTRAINT "project_personnel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_personnel" ADD CONSTRAINT "project_personnel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
