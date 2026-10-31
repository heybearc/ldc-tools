CREATE TABLE "directory_contacts" (
    "id" TEXT NOT NULL,
    "constructionGroupId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "isSister" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "directory_contacts_constructionGroupId_email_key" ON "directory_contacts"("constructionGroupId", "email");

ALTER TABLE "directory_contacts" ADD CONSTRAINT "directory_contacts_constructionGroupId_fkey" FOREIGN KEY ("constructionGroupId") REFERENCES "construction_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_team_oversight" ADD COLUMN "contactId" TEXT;
ALTER TABLE "trade_team_oversight" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "trade_team_oversight" ADD CONSTRAINT "trade_team_oversight_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "directory_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "trade_team_oversight_tradeTeamId_contactId_role_key" ON "trade_team_oversight"("tradeTeamId", "contactId", "role");
ALTER TABLE "trade_team_oversight" ADD CONSTRAINT "trade_team_oversight_person_check" CHECK ("userId" IS NOT NULL OR "contactId" IS NOT NULL);

ALTER TABLE "trade_crew_oversight" ADD COLUMN "contactId" TEXT;
ALTER TABLE "trade_crew_oversight" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "trade_crew_oversight" ADD CONSTRAINT "trade_crew_oversight_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "directory_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "trade_crew_oversight_crewId_contactId_role_key" ON "trade_crew_oversight"("crewId", "contactId", "role");
ALTER TABLE "trade_crew_oversight" ADD CONSTRAINT "trade_crew_oversight_person_check" CHECK ("userId" IS NOT NULL OR "contactId" IS NOT NULL);
