-- CreateIndex
CREATE INDEX "Booking_barberId_date_idx" ON "Booking"("barberId", "date");

-- CreateIndex
CREATE INDEX "Booking_barberId_status_idx" ON "Booking"("barberId", "status");
