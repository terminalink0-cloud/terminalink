-- CreateTable
CREATE TABLE "Boarding" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "boardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_boarding_trip" ON "Boarding"("tripId");

-- AddForeignKey
ALTER TABLE "Boarding" ADD CONSTRAINT "Boarding_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
