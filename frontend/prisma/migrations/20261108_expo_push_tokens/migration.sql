CREATE TABLE IF NOT EXISTS "expo_push_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expo_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expo_push_tokens_token_key" ON "expo_push_tokens"("token");
CREATE INDEX IF NOT EXISTS "expo_push_tokens_userId_idx" ON "expo_push_tokens"("userId");

DO $$ BEGIN
  ALTER TABLE "expo_push_tokens"
    ADD CONSTRAINT "expo_push_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
