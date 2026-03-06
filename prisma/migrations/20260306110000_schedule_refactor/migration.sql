-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_times" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_settings" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_hours_barber_id_day_of_week_idx" ON "working_hours"("barber_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_barber_id_day_of_week_start_time_end_time_key" ON "working_hours"("barber_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "blocked_times_barber_id_date_idx" ON "blocked_times"("barber_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_settings_barber_id_key" ON "schedule_settings"("barber_id");

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_settings" ADD CONSTRAINT "schedule_settings_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default settings for every barber
INSERT INTO "schedule_settings" ("id", "barber_id", "slot_interval_minutes", "created_at", "updated_at")
SELECT CONCAT('ss-', md5(random()::text || clock_timestamp()::text || b."id")), b."id", 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Barber" b
ON CONFLICT ("barber_id") DO NOTHING;

-- Best-effort migration from old per-slot availability to interval ranges (assuming 30-minute legacy slots)
WITH legacy_slots AS (
  SELECT
    ba."barberId" AS barber_id,
    ba."dayOfWeek" AS day_of_week,
    ba."time"::time AS slot_time,
    (ba."time"::time - (ROW_NUMBER() OVER (
      PARTITION BY ba."barberId", ba."dayOfWeek"
      ORDER BY ba."time"::time
    ) * INTERVAL '30 minute')) AS grp
  FROM "BarberAvailability" ba
),
intervals AS (
  SELECT
    barber_id,
    day_of_week,
    MIN(slot_time) AS start_time,
    MAX(slot_time) + INTERVAL '30 minute' AS end_time
  FROM legacy_slots
  GROUP BY barber_id, day_of_week, grp
)
INSERT INTO "working_hours" (
  "id",
  "barber_id",
  "day_of_week",
  "start_time",
  "end_time",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT('wh-', md5(random()::text || clock_timestamp()::text || i.barber_id || i.day_of_week::text)),
  i.barber_id,
  i.day_of_week,
  TO_CHAR(i.start_time, 'HH24:MI'),
  TO_CHAR(i.end_time, 'HH24:MI'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM intervals i
ON CONFLICT ("barber_id", "day_of_week", "start_time", "end_time") DO NOTHING;

-- Migrate full-day blocks into blocked_times as 00:00-23:59
INSERT INTO "blocked_times" (
  "id",
  "barber_id",
  "date",
  "start_time",
  "end_time",
  "reason",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT('bt-', md5(random()::text || clock_timestamp()::text || bd."barberId" || bd."date"::text)),
  bd."barberId",
  date_trunc('day', bd."date"),
  '00:00',
  '23:59',
  bd."reason",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "BarberBlockedDay" bd;

-- Migrate single blocked slots into 30-minute blocked ranges
INSERT INTO "blocked_times" (
  "id",
  "barber_id",
  "date",
  "start_time",
  "end_time",
  "reason",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT('bt-', md5(random()::text || clock_timestamp()::text || bs."barberId" || bs."date"::text)),
  bs."barberId",
  date_trunc('day', bs."date"),
  TO_CHAR(bs."date", 'HH24:MI'),
  TO_CHAR(bs."date" + INTERVAL '30 minute', 'HH24:MI'),
  bs."reason",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "BarberBlockedSlot" bs;
