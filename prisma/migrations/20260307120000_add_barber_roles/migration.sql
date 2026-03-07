-- CreateEnum
CREATE TYPE "BarberRole" AS ENUM ('OWNER', 'ADMIN', 'BARBER');

-- AlterTable
ALTER TABLE "Barber"
ADD COLUMN "role" "BarberRole" NOT NULL DEFAULT 'BARBER',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
