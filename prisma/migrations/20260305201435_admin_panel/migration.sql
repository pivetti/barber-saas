/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "email" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "BarberAvailability" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarberBlockedDay" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberBlockedDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarberBlockedSlot" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberBlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarberAvailability_barberId_dayOfWeek_idx" ON "BarberAvailability"("barberId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BarberAvailability_barberId_dayOfWeek_time_key" ON "BarberAvailability"("barberId", "dayOfWeek", "time");

-- CreateIndex
CREATE INDEX "BarberBlockedDay_barberId_date_idx" ON "BarberBlockedDay"("barberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BarberBlockedDay_barberId_date_key" ON "BarberBlockedDay"("barberId", "date");

-- CreateIndex
CREATE INDEX "BarberBlockedSlot_barberId_date_idx" ON "BarberBlockedSlot"("barberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BarberBlockedSlot_barberId_date_key" ON "BarberBlockedSlot"("barberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_email_key" ON "Barber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_phone_key" ON "Barber"("phone");

-- AddForeignKey
ALTER TABLE "BarberAvailability" ADD CONSTRAINT "BarberAvailability_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarberBlockedDay" ADD CONSTRAINT "BarberBlockedDay_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarberBlockedSlot" ADD CONSTRAINT "BarberBlockedSlot_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
