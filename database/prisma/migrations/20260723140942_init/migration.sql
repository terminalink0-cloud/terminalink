-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DISPATCHER', 'DRIVER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "TripDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('WAITING', 'BOARDING', 'DEPARTED', 'EN_ROUTE', 'APPROACHING', 'DOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'BOARDING', 'DEPARTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'QR_SCAN', 'START_TRIP', 'END_TRIP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3),
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatcherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "terminalName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatcherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cooperative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapZoom" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "bodyNumber" TEXT,
    "seatCapacity" INTEGER NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "yearModel" INTEGER,
    "color" TEXT,
    "qrToken" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAssignment" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignedByUserId" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "tripNumber" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "direction" "TripDirection" NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'WAITING',
    "seatCapacity" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "boardingStartedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "cancelReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleState" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "activeTripId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speedKph" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "lastGpsAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSHistory" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speedKph" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dispatcherId" TEXT NOT NULL,
    "gateType" "GateType" NOT NULL,
    "remarks" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "queuePosition" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatHistory" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "previousAvailableSeats" INTEGER NOT NULL,
    "newAvailableSeats" INTEGER NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_username" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "User"("role");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "User"("status");

-- CreateIndex
CREATE INDEX "idx_user_lastname" ON "User"("lastName");

-- CreateIndex
CREATE INDEX "idx_driver_cooperative" ON "DriverProfile"("cooperativeId");

-- CreateIndex
CREATE INDEX "idx_driver_active" ON "DriverProfile"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uk_driver_user" ON "DriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uk_driver_license" ON "DriverProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "idx_dispatcher_active" ON "DispatcherProfile"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uk_dispatcher_user" ON "DispatcherProfile"("userId");

-- CreateIndex
CREATE INDEX "idx_coop_active" ON "Cooperative"("active");

-- CreateIndex
CREATE UNIQUE INDEX "uk_coop_name" ON "Cooperative"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uk_coop_code" ON "Cooperative"("code");

-- CreateIndex
CREATE INDEX "idx_municipality_active" ON "Municipality"("active");

-- CreateIndex
CREATE UNIQUE INDEX "uk_municipality_name" ON "Municipality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uk_setting_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "idx_vehicle_cooperative" ON "Vehicle"("cooperativeId");

-- CreateIndex
CREATE INDEX "idx_vehicle_status" ON "Vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uk_vehicle_plate" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "uk_vehicle_qr" ON "Vehicle"("qrToken");

-- CreateIndex
CREATE INDEX "idx_assignment_driver" ON "VehicleAssignment"("driverId");

-- CreateIndex
CREATE INDEX "idx_assignment_vehicle" ON "VehicleAssignment"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_assignment_status" ON "VehicleAssignment"("status");

-- CreateIndex
CREATE INDEX "idx_assignment_assigned" ON "VehicleAssignment"("assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uk_assignment_history" ON "VehicleAssignment"("driverId", "vehicleId", "assignedAt");

-- CreateIndex
CREATE INDEX "idx_route_origin" ON "Route"("originId");

-- CreateIndex
CREATE INDEX "idx_route_destination" ON "Route"("destinationId");

-- CreateIndex
CREATE INDEX "idx_route_active" ON "Route"("active");

-- CreateIndex
CREATE INDEX "idx_route_display_order" ON "Route"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "uk_route_origin_destination" ON "Route"("originId", "destinationId");

-- CreateIndex
CREATE INDEX "idx_trip_status" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "idx_trip_direction" ON "Trip"("direction");

-- CreateIndex
CREATE INDEX "idx_trip_vehicle" ON "Trip"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_trip_driver" ON "Trip"("driverId");

-- CreateIndex
CREATE INDEX "idx_trip_municipality" ON "Trip"("municipalityId");

-- CreateIndex
CREATE INDEX "idx_trip_eta" ON "Trip"("estimatedArrival");

-- CreateIndex
CREATE UNIQUE INDEX "uk_trip_number" ON "Trip"("tripNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleState_vehicleId_key" ON "VehicleState"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_vs_trip" ON "VehicleState"("activeTripId");

-- CreateIndex
CREATE INDEX "idx_vs_lastgps" ON "VehicleState"("lastGpsAt");

-- CreateIndex
CREATE INDEX "idx_gps_trip" ON "GPSHistory"("tripId");

-- CreateIndex
CREATE INDEX "idx_gps_vehicle" ON "GPSHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_gps_time" ON "GPSHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "idx_gate_trip" ON "GateEvent"("tripId");

-- CreateIndex
CREATE INDEX "idx_gate_dispatcher" ON "GateEvent"("dispatcherId");

-- CreateIndex
CREATE INDEX "idx_gate_type" ON "GateEvent"("gateType");

-- CreateIndex
CREATE UNIQUE INDEX "QueueEntry_tripId_key" ON "QueueEntry"("tripId");

-- CreateIndex
CREATE INDEX "idx_queue_position" ON "QueueEntry"("queuePosition");

-- CreateIndex
CREATE INDEX "idx_queue_status" ON "QueueEntry"("status");

-- CreateIndex
CREATE INDEX "idx_seat_trip" ON "SeatHistory"("tripId");

-- CreateIndex
CREATE INDEX "idx_seat_created" ON "SeatHistory"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatcherProfile" ADD CONSTRAINT "DispatcherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleState" ADD CONSTRAINT "VehicleState_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleState" ADD CONSTRAINT "VehicleState_activeTripId_fkey" FOREIGN KEY ("activeTripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSHistory" ADD CONSTRAINT "GPSHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSHistory" ADD CONSTRAINT "GPSHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateEvent" ADD CONSTRAINT "GateEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateEvent" ADD CONSTRAINT "GateEvent_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "DispatcherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatHistory" ADD CONSTRAINT "SeatHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
