ALTER TABLE "work_items" ADD COLUMN "notifyRequestor" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "crew_change_requests" ADD COLUMN "notifyRequestor" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "ChatChannelKind" AS ENUM ('TEAM', 'DIRECT');

CREATE TABLE "chat_channels" (
    "id" TEXT NOT NULL,
    "constructionGroupId" TEXT NOT NULL,
    "kind" "ChatChannelKind" NOT NULL,
    "directKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_reads" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_push_config" (
    "id" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "chat_push_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_channels_constructionGroupId_directKey_key" ON "chat_channels"("constructionGroupId", "directKey");
CREATE INDEX "chat_channels_constructionGroupId_idx" ON "chat_channels"("constructionGroupId");
CREATE INDEX "chat_messages_channelId_createdAt_idx" ON "chat_messages"("channelId", "createdAt");
CREATE UNIQUE INDEX "chat_reads_channelId_userId_key" ON "chat_reads"("channelId", "userId");
CREATE UNIQUE INDEX "chat_push_subscriptions_endpoint_key" ON "chat_push_subscriptions"("endpoint");
CREATE INDEX "chat_push_subscriptions_userId_idx" ON "chat_push_subscriptions"("userId");

ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_constructionGroupId_fkey" FOREIGN KEY ("constructionGroupId") REFERENCES "construction_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_push_subscriptions" ADD CONSTRAINT "chat_push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
