
/*
  Terminalink TripLeg migration

  Existing trips are preserved.

  Every existing Trip receives an OUTBOUND TripLeg:
    MUNICIPALITY -> TERMINAL

  Existing QueueEntry, Boarding and GPSHistory rows are
  attached to that outbound leg.
*/


-- ============================================================
-- 1. CREATE NEW ENUMS
-- ============================================================

CREATE TYPE "TripLegType"
AS ENUM (
  'OUTBOUND',
  'RETURN'
);

CREATE TYPE "TripLegStatus"
AS ENUM (
  'WAITING',
  'BOARDING',
  'EN_ROUTE',
  'APPROACHING',
  'ARRIVED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "TripPointType"
AS ENUM (
  'MUNICIPALITY',
  'TERMINAL'
);


-- ============================================================
-- 2. CREATE TRIP LEG TABLE
-- ============================================================

CREATE TABLE "TripLeg" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,

  "legType" "TripLegType" NOT NULL,

  "originType" "TripPointType" NOT NULL,
  "destinationType" "TripPointType" NOT NULL,

  "status" "TripLegStatus" NOT NULL DEFAULT 'WAITING',

  "boardingStartedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "approachingAt" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TripLeg_pkey"
    PRIMARY KEY ("id")
);


-- ============================================================
-- 3. ADD NEW COLUMNS AS NULLABLE
-- ============================================================

ALTER TABLE "Boarding"
ADD COLUMN "tripLegId" TEXT;

ALTER TABLE "GPSHistory"
ADD COLUMN "tripLegId" TEXT;

ALTER TABLE "QueueEntry"
ADD COLUMN "tripLegId" TEXT;


-- ============================================================
-- 4. CREATE ONE OUTBOUND LEG FOR EVERY EXISTING TRIP
--
-- Existing parent Trip.status is mapped to TripLeg.status.
-- ============================================================

INSERT INTO "TripLeg" (
  "id",
  "tripId",
  "legType",
  "originType",
  "destinationType",
  "status",
  "boardingStartedAt",
  "startedAt",
  "approachingAt",
  "arrivedAt",
  "completedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || t."id",
  t."id",

  'OUTBOUND'::"TripLegType",

  'MUNICIPALITY'::"TripPointType",
  'TERMINAL'::"TripPointType",

  CASE t."status"
    WHEN 'WAITING' THEN 'WAITING'::"TripLegStatus"
    WHEN 'BOARDING' THEN 'BOARDING'::"TripLegStatus"
    WHEN 'EN_ROUTE' THEN 'EN_ROUTE'::"TripLegStatus"
    WHEN 'APPROACHING' THEN 'APPROACHING'::"TripLegStatus"
    WHEN 'DOCKED' THEN 'ARRIVED'::"TripLegStatus"
    WHEN 'COMPLETED' THEN 'COMPLETED'::"TripLegStatus"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"TripLegStatus"
    WHEN 'DEPARTED' THEN 'EN_ROUTE'::"TripLegStatus"
  END,

  t."boardingStartedAt",
  t."startedAt",

  CASE
    WHEN t."status" = 'APPROACHING'
      THEN t."updatedAt"
    ELSE NULL
  END,

  t."arrivedAt",
  t."completedAt",

  t."createdAt",
  t."updatedAt"

FROM "Trip" t;


-- ============================================================
-- 5. BACKFILL BOARDING
-- ============================================================

UPDATE "Boarding" b
SET "tripLegId" =
  'legacy_' || b."tripId";


-- ============================================================
-- 6. BACKFILL GPS HISTORY
-- ============================================================

UPDATE "GPSHistory" g
SET "tripLegId" =
  'legacy_' || g."tripId";


-- ============================================================
-- 7. BACKFILL EXISTING QUEUE ENTRIES
-- ============================================================

UPDATE "QueueEntry" q
SET "tripLegId" =
  'legacy_' || q."tripId";


-- ============================================================
-- 8. VERIFY NO NULL REFERENCES REMAIN
-- ============================================================

DO $$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM "Boarding"
    WHERE "tripLegId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Boarding tripLegId backfill failed';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM "GPSHistory"
    WHERE "tripLegId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'GPSHistory tripLegId backfill failed';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM "QueueEntry"
    WHERE "tripLegId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'QueueEntry tripLegId backfill failed';
  END IF;

END $$;


-- ============================================================
-- 9. MAKE NEW REFERENCES REQUIRED
-- ============================================================

ALTER TABLE "Boarding"
ALTER COLUMN "tripLegId"
SET NOT NULL;

ALTER TABLE "GPSHistory"
ALTER COLUMN "tripLegId"
SET NOT NULL;

ALTER TABLE "QueueEntry"
ALTER COLUMN "tripLegId"
SET NOT NULL;


-- ============================================================
-- 10. CREATE INDEXES
-- ============================================================

CREATE INDEX "idx_trip_leg_trip"
ON "TripLeg"("tripId");

CREATE INDEX "idx_trip_leg_status"
ON "TripLeg"("status");

CREATE INDEX "idx_trip_leg_type"
ON "TripLeg"("legType");

CREATE INDEX "idx_trip_leg_trip_type"
ON "TripLeg"("tripId", "legType");

CREATE INDEX "idx_boarding_leg"
ON "Boarding"("tripLegId");

CREATE INDEX "idx_boarding_leg_seat"
ON "Boarding"("tripLegId", "seatNumber");

CREATE INDEX "idx_gps_leg"
ON "GPSHistory"("tripLegId");

CREATE INDEX "idx_queue_leg"
ON "QueueEntry"("tripLegId");

CREATE INDEX "idx_queue_leg_position"
ON "QueueEntry"(
  "tripLegId",
  "queuePosition"
);


-- ============================================================
-- 11. REMOVE OLD QUEUE UNIQUE INDEX
--
-- Old QueueEntry.tripId was unique.
-- A Trip can now have multiple legs.
-- ============================================================

DROP INDEX IF EXISTS
"public"."QueueEntry_tripId_key";


-- ============================================================
-- 12. REMOVE OLD QUEUE FOREIGN KEY
-- ============================================================

ALTER TABLE "QueueEntry"
DROP CONSTRAINT IF EXISTS
"QueueEntry_tripId_fkey";


-- ============================================================
-- 13. ADD NEW FOREIGN KEYS
-- ============================================================

ALTER TABLE "TripLeg"
ADD CONSTRAINT
"TripLeg_tripId_fkey"
FOREIGN KEY ("tripId")
REFERENCES "Trip"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE "Boarding"
ADD CONSTRAINT
"Boarding_tripLegId_fkey"
FOREIGN KEY ("tripLegId")
REFERENCES "TripLeg"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE "GPSHistory"
ADD CONSTRAINT
"GPSHistory_tripLegId_fkey"
FOREIGN KEY ("tripLegId")
REFERENCES "TripLeg"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE "QueueEntry"
ADD CONSTRAINT
"QueueEntry_tripLegId_fkey"
FOREIGN KEY ("tripLegId")
REFERENCES "TripLeg"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- ============================================================
-- 14. REMOVE OLD QUEUE TRIP ID
-- ============================================================

ALTER TABLE "QueueEntry"
DROP COLUMN "tripId";
