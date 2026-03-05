-- Switch user auth from email to name + phone
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Backfill phone for existing rows to keep migration safe in non-empty databases.
UPDATE "User"
SET "phone" = regexp_replace(COALESCE("email", ''), '[^0-9]', '', 'g')
WHERE "phone" IS NULL;

UPDATE "User"
SET "phone" = '55' || substring(replace("id", '-', '') from 1 for 11)
WHERE "phone" = '';

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" DROP COLUMN "email";
