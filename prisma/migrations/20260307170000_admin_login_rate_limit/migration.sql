CREATE TABLE "AdminLoginAttempt" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "blockedUntil" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminLoginAttempt_email_ipAddress_key"
ON "AdminLoginAttempt"("email", "ipAddress");

CREATE INDEX "AdminLoginAttempt_blockedUntil_idx"
ON "AdminLoginAttempt"("blockedUntil");
