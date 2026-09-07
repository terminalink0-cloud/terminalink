
// apps/api/src/gps/gps.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  TripLegStatus,
  TripPointType,
} from "@prisma/client";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateGpsDto,
} from "./dto/create-gps.dto";


@Injectable()
export class GpsService {

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}


  // ==========================================================
  // RECORD GPS POSITION
  //
  // GPS belongs to a specific TripLeg.
  //
  // Valid operational states:
  //
  // OUTBOUND:
  //   EN_ROUTE
  //   APPROACHING
  //
  // RETURN:
  //   EN_ROUTE
  //
  // GPS does NOT automatically change the operational
  // status anymore.
  // ==========================================================

  async create(
    dto: CreateGpsDto,
  ) {

    // --------------------------------------------------------
    // VALIDATE TRIP
    // --------------------------------------------------------

    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            dto.tripId,
        },

        select: {
          id: true,
          vehicleId: true,
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    // --------------------------------------------------------
    // VEHICLE MUST BELONG TO TRIP
    // --------------------------------------------------------

    if (
      trip.vehicleId !==
      dto.vehicleId
    ) {
      throw new BadRequestException(
        "Vehicle does not belong to this trip",
      );
    }


    // --------------------------------------------------------
    // GET LEG
    // --------------------------------------------------------

    const leg =
      await this.prisma.tripLeg.findFirst({
        where: {
          id:
            dto.tripLegId,

          tripId:
            dto.tripId,
        },

        select: {
          id: true,
          tripId: true,
          legType: true,
          status: true,
          originType: true,
          destinationType: true,
        },
      });


    if (!leg) {
      throw new NotFoundException(
        "Trip leg not found for this trip",
      );
    }


    // --------------------------------------------------------
    // GPS IS ONLY VALID DURING ACTIVE MOVEMENT
    // --------------------------------------------------------

    const gpsAllowed =
      leg.status ===
        TripLegStatus.EN_ROUTE ||
      leg.status ===
        TripLegStatus.APPROACHING;


    if (!gpsAllowed) {
      throw new BadRequestException(
        `GPS tracking is not active for this trip leg. Current leg status: ${leg.status}`,
      );
    }


    // --------------------------------------------------------
    // RETURN LEGS SHOULD NEVER BE APPROACHING TERMINAL
    //
    // This protects the business rule even if an old client
    // sends an invalid status.
    // --------------------------------------------------------

    if (
      leg.destinationType !==
        TripPointType.TERMINAL &&
      leg.status ===
        TripLegStatus.APPROACHING
    ) {
      throw new BadRequestException(
        "A leg whose destination is the municipality cannot use terminal APPROACHING status",
      );
    }


    // --------------------------------------------------------
    // CREATE GPS HISTORY
    // --------------------------------------------------------

    const gps =
      await this.prisma.gPSHistory.create({
        data: {
          tripId:
            dto.tripId,

          tripLegId:
            dto.tripLegId,

          vehicleId:
            dto.vehicleId,

          latitude:
            dto.latitude,

          longitude:
            dto.longitude,

          speedKph:
            dto.speedKph,

          heading:
            dto.heading,

          accuracy:
            dto.accuracy,
        },
      });


    // --------------------------------------------------------
    // UPDATE LIVE VEHICLE STATE
    //
    // VehicleState represents the current location of the
    // vehicle. It does not determine the trip workflow.
    // --------------------------------------------------------

    await this.prisma.vehicleState.upsert({
      where: {
        vehicleId:
          dto.vehicleId,
      },

      update: {
        activeTripId:
          dto.tripId,

        latitude:
          dto.latitude,

        longitude:
          dto.longitude,

        speedKph:
          dto.speedKph,

        heading:
          dto.heading,

        accuracy:
          dto.accuracy,

        lastGpsAt:
          new Date(),
      },

      create: {
        vehicleId:
          dto.vehicleId,

        activeTripId:
          dto.tripId,

        latitude:
          dto.latitude,

        longitude:
          dto.longitude,

        speedKph:
          dto.speedKph,

        heading:
          dto.heading,

        accuracy:
          dto.accuracy,

        lastGpsAt:
          new Date(),
      },
    });


    return {
      gps,

      tripId:
        dto.tripId,

      tripLegId:
        dto.tripLegId,

      vehicleId:
        dto.vehicleId,

      legType:
        leg.legType,

      originType:
        leg.originType,

      destinationType:
        leg.destinationType,

      status:
        leg.status,

      recordedAt:
        gps.recordedAt,
    };
  }


  // ==========================================================
  // TRIP GPS HISTORY
  // ==========================================================

  async findTripHistory(
    tripId: string,
  ) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            tripId,
        },

        select: {
          id: true,
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    return this.prisma.gPSHistory.findMany({
      where: {
        tripId,
      },

      orderBy: {
        recordedAt:
          "asc",
      },
    });
  }


  // ==========================================================
  // TRIP LEG GPS HISTORY
  // ==========================================================

  async findLegHistory(
    tripLegId: string,
  ) {
    const leg =
      await this.prisma.tripLeg.findUnique({
        where: {
          id:
            tripLegId,
        },

        select: {
          id: true,
          tripId: true,
          legType: true,
          status: true,
        },
      });


    if (!leg) {
      throw new NotFoundException(
        "Trip leg not found",
      );
    }


    return this.prisma.gPSHistory.findMany({
      where: {
        tripLegId,
      },

      orderBy: {
        recordedAt:
          "asc",
      },
    });
  }


  // ==========================================================
  // LATEST GPS POSITION FOR A LEG
  // ==========================================================

  async findLatestLegPosition(
    tripLegId: string,
  ) {
    const leg =
      await this.prisma.tripLeg.findUnique({
        where: {
          id:
            tripLegId,
        },

        select: {
          id: true,
        },
      });


    if (!leg) {
      throw new NotFoundException(
        "Trip leg not found",
      );
    }


    return this.prisma.gPSHistory.findFirst({
      where: {
        tripLegId,
      },

      orderBy: {
        recordedAt:
          "desc",
      },
    });
  }


  // ==========================================================
  // VEHICLE LIVE STATE
  // ==========================================================

  async findVehicleState(
    vehicleId: string,
  ) {
    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id:
            vehicleId,
        },

        select: {
          id: true,
        },
      });


    if (!vehicle) {
      throw new NotFoundException(
        "Vehicle not found",
      );
    }


    return this.prisma.vehicleState.findUnique({
      where: {
        vehicleId,
      },
    });
  }
}
