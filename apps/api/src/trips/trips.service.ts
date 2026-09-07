import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  Prisma,
  QueueStatus,
  TripLegStatus,
  TripLegType,
  TripPointType,
  TripStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateTripDto } from "./dto/create-trip.dto";
import { UpdateTripDto } from "./dto/update-trip.dto";

// ============================================================
// PUBLIC USER SELECT
// ============================================================

const publicUserSelect = {
  id: true,
  username: true,
  role: true,
  status: true,
  firstName: true,
  middleName: true,
  lastName: true,
  displayName: true,
  phone: true,
  email: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ============================================================
// TRIP INCLUDE
// ============================================================

const tripInclude = {
  driver: {
    include: {
      user: {
        select: publicUserSelect,
      },
      cooperative: true,
    },
  },
  vehicle: true,
  route: {
    include: {
      origin: true,
      destination: true,
    },
  },
  municipality: true,
  legs: {
    orderBy: {
      createdAt: "asc" as const,
    },
    include: {
      queueEntries: {
        orderBy: {
          queuePosition: "asc" as const,
        },
      },
    },
  },
} as const;

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================
  // CREATE TRIP
  // ==========================================================

  async create(dto: CreateTripDto) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: dto.driverId },
      select: {
        id: true,
        cooperativeId: true,
        isActive: true,
        user: { select: { status: true, role: true } },
      },
    });

    if (!driver) throw new NotFoundException("Driver not found");
    if (!driver.isActive) throw new BadRequestException("Driver profile is inactive");
    if (driver.user.role !== "DRIVER") throw new BadRequestException("Assigned user is not a driver");
    if (driver.user.status !== "ACTIVE") throw new BadRequestException("Driver account is inactive");

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      select: { id: true, cooperativeId: true, seatCapacity: true },
    });

    if (!vehicle) throw new NotFoundException("Vehicle not found");
    if (vehicle.cooperativeId !== driver.cooperativeId)
      throw new BadRequestException("Vehicle must belong to the driver's cooperative");

    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      select: { id: true, originId: true, destinationId: true },
    });

    if (!route) throw new NotFoundException("Route not found");

    const municipality = await this.prisma.municipality.findUnique({
      where: { id: dto.municipalityId },
      select: { id: true },
    });

    if (!municipality) throw new NotFoundException("Municipality not found");
    if (dto.seatCapacity <= 0) throw new BadRequestException("Seat capacity must be greater than zero");

    if (dto.direction === "OUTBOUND" && route.originId !== dto.municipalityId)
      throw new BadRequestException("Municipality must match the route origin for an OUTBOUND trip");

    return this.prisma.$transaction(async (tx) => {
      const latestQueue = await tx.queueEntry.findFirst({
        where: {
          status: { in: [QueueStatus.WAITING, QueueStatus.BOARDING] },
          tripLeg: {
            legType: TripLegType.OUTBOUND,
            originType: TripPointType.MUNICIPALITY,
            destinationType: TripPointType.TERMINAL,
            status: { in: [TripLegStatus.WAITING, TripLegStatus.BOARDING] },
            trip: { driver: { cooperativeId: driver.cooperativeId } },
          },
        },
        orderBy: [{ queuePosition: "desc" }, { createdAt: "desc" }],
        select: { queuePosition: true },
      });

      const queuePosition = (latestQueue?.queuePosition ?? 0) + 1;

      const trip = await tx.trip.create({
        data: {
          tripNumber: dto.tripNumber,
          driverId: dto.driverId,
          vehicleId: dto.vehicleId,
          routeId: dto.routeId,
          municipalityId: dto.municipalityId,
          direction: dto.direction,
          status: TripStatus.WAITING,
          seatCapacity: dto.seatCapacity,
          availableSeats: dto.seatCapacity,
          estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : undefined,
          notes: dto.notes,
        },
      });

      const outboundLeg = await tx.tripLeg.create({
        data: {
          tripId: trip.id,
          legType: TripLegType.OUTBOUND,
          originType: TripPointType.MUNICIPALITY,
          destinationType: TripPointType.TERMINAL,
          status: TripLegStatus.WAITING,
        },
      });

      await tx.queueEntry.create({
        data: {
          tripLegId: outboundLeg.id,
          queuePosition,
          status: QueueStatus.WAITING,
        },
      });

      return tx.trip.findUnique({
        where: { id: trip.id },
        include: tripInclude,
      });
    });
  }

  // ==========================================================
  // ADMIN LIST
  // ==========================================================

  async findAll(query?: { page?: string; limit?: string; search?: string; status?: string }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.max(Number(query?.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.TripWhereInput = {};

    if (query?.search) {
      where.tripNumber = { contains: query.search, mode: "insensitive" };
    }

    if (query?.status && !Object.values(TripStatus).includes(query.status as TripStatus)) {
      throw new BadRequestException("Invalid trip status");
    }

    if (query?.status) {
      where.status = query.status as TripStatus;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: tripInclude,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==========================================================
  // ADMIN GET
  // ==========================================================

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: tripInclude,
    });

    if (!trip) throw new NotFoundException("Trip not found");
    return trip;
  }

  // ==========================================================
  // ADMIN UPDATE
  // ==========================================================

  async update(id: string, dto: UpdateTripDto) {
    const existingTrip = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTrip) throw new NotFoundException("Trip not found");

    let driverId: string | undefined;

    if (dto.driverId !== undefined) {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { id: dto.driverId },
        select: {
          id: true,
          isActive: true,
          user: { select: { role: true, status: true } },
        },
      });

      if (!driver) throw new NotFoundException("Driver not found");
      if (!driver.isActive) throw new BadRequestException("Driver profile is inactive");
      if (driver.user.role !== "DRIVER") throw new BadRequestException("Assigned user is not a driver");
      if (driver.user.status !== "ACTIVE") throw new BadRequestException("Driver account is inactive");
      driverId = driver.id;
    }

    const data: Prisma.TripUpdateInput = {
      ...(dto.tripNumber !== undefined ? { tripNumber: dto.tripNumber } : {}),
      ...(driverId !== undefined ? { driver: { connect: { id: driverId } } } : {}),
      ...(dto.vehicleId !== undefined ? { vehicle: { connect: { id: dto.vehicleId } } } : {}),
      ...(dto.routeId !== undefined ? { route: { connect: { id: dto.routeId } } } : {}),
      ...(dto.municipalityId !== undefined ? { municipality: { connect: { id: dto.municipalityId } } } : {}),
      ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
      ...(dto.seatCapacity !== undefined ? { seatCapacity: dto.seatCapacity } : {}),
      ...(dto.estimatedArrival !== undefined
        ? { estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : null }
        : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };

    return this.prisma.trip.update({
      where: { id },
      data,
      include: tripInclude,
    });
  }

  // ==========================================================
  // ADMIN COMPLETE
  // ==========================================================

  async completeTrip(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { legs: { orderBy: { createdAt: "desc" } } },
    });

    if (!trip) throw new NotFoundException("Trip not found");

    const currentLeg = trip.legs[trip.legs.length - 1];
    if (!currentLeg) throw new BadRequestException("Trip has no operational leg");

    if (currentLeg.status !== TripLegStatus.ARRIVED && trip.status !== TripStatus.DOCKED)
      throw new BadRequestException("Trip must have arrived before completion");

    return this.prisma.$transaction(async (tx) => {
      await tx.tripLeg.update({
        where: { id: currentLeg.id },
        data: { status: TripLegStatus.COMPLETED, completedAt: new Date() },
      });

      return tx.trip.update({
        where: { id: trip.id },
        data: { status: TripStatus.COMPLETED, completedAt: new Date() },
        include: tripInclude,
      });
    });
  }

  // ==========================================================
  // UPDATE AVAILABLE SEATS
  // ==========================================================

  async updateAvailableSeats(tripId: string, availableSeats: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, seatCapacity: true, availableSeats: true },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID "${tripId}" not found`);
    }

    const validSeats = Math.max(0, Math.min(trip.seatCapacity, availableSeats));

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { availableSeats: validSeats },
    });

    // Optional: create a seat history record
    await this.prisma.seatHistory.create({
      data: {
        tripId: tripId,
        previousAvailableSeats: trip.availableSeats,
        newAvailableSeats: validSeats,
      },
    });

    return updated;
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async remove(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!trip) throw new NotFoundException("Trip not found");
    return this.prisma.trip.delete({ where: { id } });
  }
}