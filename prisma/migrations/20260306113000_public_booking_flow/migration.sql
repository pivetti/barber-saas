ALTER TABLE "Booking"
ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "cancellationToken" TEXT,
ADD COLUMN "cancellationRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3),
ALTER COLUMN "userId" DROP NOT NULL;

UPDATE "Booking" AS b
SET
  "customerName" = COALESCE(u."name", 'Cliente'),
  "customerPhone" = COALESCE(u."phone", '')
FROM "User" AS u
WHERE b."userId" = u."id";

UPDATE "Booking"
SET
  "customerName" = COALESCE("customerName", 'Cliente'),
  "customerPhone" = COALESCE("customerPhone", ''),
  "cancellationToken" = COALESCE("cancellationToken", concat('ct_', replace(id::text, '-', ''), '_', substring(md5(random()::text || clock_timestamp()::text) from 1 for 10)));

ALTER TABLE "Booking"
ALTER COLUMN "customerName" SET NOT NULL,
ALTER COLUMN "customerPhone" SET NOT NULL,
ALTER COLUMN "cancellationToken" SET NOT NULL;

CREATE UNIQUE INDEX "Booking_cancellationToken_key" ON "Booking"("cancellationToken");

ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
