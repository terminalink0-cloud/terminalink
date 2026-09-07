-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QR', 'CARD');

-- CreateTable
CREATE TABLE "Fare" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "boardingId" TEXT,
    "passengerName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_fare_trip" ON "Fare"("tripId");

-- CreateIndex
CREATE INDEX "idx_fare_paid" ON "Fare"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "uk_fare_boarding" ON "Fare"("boardingId");

-- AddForeignKey
ALTER TABLE "Fare" ADD CONSTRAINT "Fare_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fare" ADD CONSTRAINT "Fare_boardingId_fkey" FOREIGN KEY ("boardingId") REFERENCES "Boarding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
