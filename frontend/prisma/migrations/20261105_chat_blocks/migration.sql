CREATE TABLE "chat_blocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_blocks_userId_blockedUserId_key" ON "chat_blocks"("userId", "blockedUserId");
CREATE INDEX "chat_blocks_blockedUserId_idx" ON "chat_blocks"("blockedUserId");

ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
