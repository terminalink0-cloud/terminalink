import {
  BadRequestException,
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


export type LiveVehicle = {
  tripId: string;
  tripLegId: string;

  tripNumber: string;

  status: string;

  availableSeats: number;
  seatCapacity: number;

  vehicle: {
    id: string;
    plateNumber: string;
    make: string | null;
    model: string | null;
  };

  driver: {
    id: string;
    displayName: string;
  };

  cooperative: {
    id: string;
    name: string;
  };

  route: {
    origin: string;
    destination: string;
  };

  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    recordedAt: string;
  };
};


@Injectable()
export class TrackingService {
  private readonly liveVehicles =
    new Map<string, LiveVehicle>();


  constructor(
    private readonly prisma: PrismaService,
  ) {}


  async updateDriverLocation(
    userId: string,
    input: {
      tripId: string;
      tripLegId: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      recordedAt?: string;
    },
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver profile not found",
      );
    }


    const trip =
      await this.prisma.trip.findFirst({
        where: {
          id: input.tripId,
          driverId: driver.id,
        },

        include: {
          vehicle: true,

          route: {
            include: {
              origin: true,
              destination: true,
            },
          },

          driver: {
            include: {
              user: {
                select: {
                  displayName: true,
                  firstName: true,
                  lastName: true,
                },
              },

              cooperative: true,
            },
          },

          legs: {
            where: {
              id: input.tripLegId,
            },

            take: 1,
          },
        },
      });


    if (!trip) {
      throw new BadRequestException(
        "Trip does not belong to this driver",
      );
    }


    const leg =
      trip.legs[0];


    if (!leg) {
      throw new NotFoundException(
        "Trip leg not found",
      );
    }


    const gpsActiveStatuses =
  new Set<TripLegStatus>([
    TripLegStatus.EN_ROUTE,
    TripLegStatus.APPROACHING,
  ]);

if (
  !gpsActiveStatuses.has(
    leg.status,
  )
) {
  this.liveVehicles.delete(
    trip.id,
  );

  throw new BadRequestException(
    `GPS tracking is not active for trip status ${leg.status}`,
  );
}


    if (
      leg.destinationType !==
      TripPointType.TERMINAL &&
      leg.destinationType !==
      TripPointType.MUNICIPALITY
    ) {
      throw new BadRequestException(
        "Invalid trip destination",
      );
    }


    const displayName =
      trip.driver.user.displayName ||
      [
        trip.driver.user.firstName,
        trip.driver.user.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Driver";


    const recordedAt =
      input.recordedAt &&
      !Number.isNaN(
        Date.parse(
          input.recordedAt,
        ),
      )
        ? new Date(
            input.recordedAt,
          ).toISOString()
        : new Date().toISOString();


    const liveVehicle: LiveVehicle = {
      tripId: trip.id,

      tripLegId:
        input.tripLegId,

      tripNumber:
        trip.tripNumber,

      status:
        leg.status,

      availableSeats:
        trip.availableSeats,

      seatCapacity:
        trip.seatCapacity,

      vehicle: {
        id:
          trip.vehicle.id,

        plateNumber:
          trip.vehicle.plateNumber,

        make:
          trip.vehicle.make,

        model:
          trip.vehicle.model,
      },

      driver: {
        id:
          driver.id,

        displayName,
      },

      cooperative: {
        id:
          trip.driver.cooperative.id,

        name:
          trip.driver.cooperative.name,
      },

      route: {
        origin:
          trip.route.origin.name,

        destination:
          trip.route.destination.name,
      },

      location: {
        latitude:
          input.latitude,

        longitude:
          input.longitude,

        accuracy:
          input.accuracy ??
          null,

        heading:
          input.heading ??
          null,

        speed:
          input.speed ??
          null,

        recordedAt,
      },
    };


    this.liveVehicles.set(
      trip.id,
      liveVehicle,
    );


    return liveVehicle;
  }


  removeTrip(
    tripId: string,
  ) {
    this.liveVehicles.delete(
      tripId,
    );
  }


  getLiveVehicles(): LiveVehicle[] {
    return Array.from(
      this.liveVehicles.values(),
    ).filter(
      (vehicle) => {
        const age =
          Date.now() -
          new Date(
            vehicle.location.recordedAt,
          ).getTime();

        return age <= 30_000;
      },
    );
  }


  getLiveVehicle(
    tripId: string,
  ) {
    return (
      this.getLiveVehicles().find(
        (vehicle) =>
          vehicle.tripId ===
          tripId,
      ) ??
      null
    );
  }
}