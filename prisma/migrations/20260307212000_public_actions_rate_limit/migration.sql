CREATE TABLE "RateLimitAttempt" (
  "id" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "blockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitAttempt_ipAddress_route_key"
ON "RateLimitAttempt"("ipAddress", "route");

CREATE INDEX "RateLimitAttempt_blockedUntil_idx"
ON "RateLimitAttempt"("blockedUntil");
