
// apps/api/src/drivers/drivers.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AssignmentStatus,
  Prisma,
  TripLegStatus,
  TripLegType,
  TripPointType,
  TripStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

import {
  randomUUID,
} from "crypto";

import * as bcrypt from "bcrypt";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateDriverDto,
} from "./dto/create-driver.dto";

import {
  UpdateDriverDto,
} from "./dto/update-driver.dto";


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
// DRIVER TRIP INCLUDE
// ============================================================

const driverTripInclude = {
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
      createdAt:
        "asc" as const,
    },

    include: {
      queueEntries: {
        orderBy: {
          queuePosition:
            "asc" as const,
        },
      },

      boardings: {
        orderBy: {
          boardedAt:
            "asc" as const,
        },
      },
    },
  },
} as const;


// ============================================================
// TYPES
// ============================================================

type DriverTrip =
  Prisma.TripGetPayload<{
    include:
      typeof driverTripInclude;
  }>;


// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}


  // ==========================================================
  // CREATE DRIVER
  // ==========================================================

// ==========================================================
// CREATE DRIVER
//
// Creates:
//   1. User account with DRIVER role
//   2. DriverProfile linked to that user
//   3. Cooperative relationship
//
// Everything is committed in one transaction.
// ==========================================================

async create(
  dto: CreateDriverDto,
) {
  const username =
    dto.username.trim();


  const firstName =
    dto.firstName.trim();


  const lastName =
    dto.lastName.trim();


  const licenseNumber =
    dto.licenseNumber.trim();


  const cooperativeId =
    dto.cooperativeId.trim();


  if (!username) {
    throw new BadRequestException(
      "Username is required.",
    );
  }


  if (!dto.password) {
    throw new BadRequestException(
      "Password is required.",
    );
  }


  if (!firstName) {
    throw new BadRequestException(
      "First name is required.",
    );
  }


  if (!lastName) {
    throw new BadRequestException(
      "Last name is required.",
    );
  }


  if (!licenseNumber) {
    throw new BadRequestException(
      "License number is required.",
    );
  }


  if (!cooperativeId) {
    throw new BadRequestException(
      "Cooperative is required.",
    );
  }


  // ----------------------------------------------------------
  // CHECK COOPERATIVE
  // ----------------------------------------------------------

  const cooperative =
    await this.prisma.cooperative.findUnique({
      where: {
        id:
          cooperativeId,
      },

      select: {
        id: true,
        name: true,
        active: true,
      },
    });


  if (!cooperative) {
    throw new NotFoundException(
      "Cooperative not found.",
    );
  }


  if (!cooperative.active) {
    throw new BadRequestException(
      "Selected cooperative is inactive.",
    );
  }


  // ----------------------------------------------------------
  // CHECK USERNAME
  // ----------------------------------------------------------

  const existingUsername =
    await this.prisma.user.findUnique({
      where: {
        username,
      },

      select: {
        id: true,
      },
    });


  if (existingUsername) {
    throw new BadRequestException(
      "Username is already in use.",
    );
  }


  // ----------------------------------------------------------
  // OPTIONAL EMAIL CHECK
  // ----------------------------------------------------------

  if (dto.email?.trim()) {
    const existingEmail =
      await this.prisma.user.findUnique({
        where: {
          email:
            dto.email
              .trim()
              .toLowerCase(),
        },

        select: {
          id: true,
        },
      });


    if (existingEmail) {
      throw new BadRequestException(
        "Email is already in use.",
      );
    }
  }


  // ----------------------------------------------------------
  // CHECK LICENSE
  // ----------------------------------------------------------

  const existingLicense =
    await this.prisma.driverProfile.findFirst({
      where: {
        licenseNumber,
      },

      select: {
        id: true,
      },
    });


  if (existingLicense) {
    throw new BadRequestException(
      "License number is already registered.",
    );
  }


  // ----------------------------------------------------------
  // PASSWORD HASH
  // ----------------------------------------------------------

  const passwordHash =
    await bcrypt.hash(
      dto.password,
      10,
    );


  // ----------------------------------------------------------
  // TRANSACTION
  // ----------------------------------------------------------

  const created =
    await this.prisma.$transaction(
      async (tx) => {
        const user =
          await tx.user.create({
            data: {
              username,

              passwordHash,

              firstName,

              lastName,

              displayName:
                `${firstName} ${lastName}`.trim(),

              email:
                dto.email?.trim()
                  ? dto.email
                      .trim()
                      .toLowerCase()
                  : undefined,

              phone:
                dto.phone?.trim()
                  ? dto.phone.trim()
                  : undefined,

              role:
                UserRole.DRIVER,

              status:
                UserStatus.ACTIVE,
            },

            select: {
              id: true,
              username: true,
              role: true,
              status: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
              phone: true,
            },
          });


        const driver =
          await tx.driverProfile.create({
            data: {
              userId:
                user.id,

              cooperativeId:
                cooperative.id,

              licenseNumber,

              licenseExpiry:
                dto.licenseExpiry
                  ? new Date(
                      dto.licenseExpiry,
                    )
                  : undefined,

              emergencyContact:
                dto.emergencyContact?.trim()
                  ? dto.emergencyContact.trim()
                  : undefined,

              emergencyPhone:
                dto.emergencyPhone?.trim()
                  ? dto.emergencyPhone.trim()
                  : undefined,

              isActive:
                dto.isActive ??
                true,
            },

            include: {
              user: {
                select:
                  publicUserSelect,
              },

              cooperative: true,
            },
          });


        return {
          ...driver,

          user: {
            ...driver.user,

            passwordHash:
              undefined,
          },
        };
      },
    );


  return created;
}
  // ==========================================================
  // LIST ALL DRIVERS
  //
  // Includes the driver's active vehicle assignment.
  // ==========================================================

  async findAll() {
    const drivers =
      await this.prisma.driverProfile.findMany({
        include: {
          user: {
            select:
              publicUserSelect,
          },

          cooperative: true,

          assignments: {
            where: {
              status:
                AssignmentStatus.ACTIVE,

              vehicle: {
                status:
                  "ACTIVE",

                deletedAt:
                  null,
              },
            },

            orderBy: {
              assignedAt:
                "desc",
            },

            take: 1,

            include: {
              vehicle: true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });


    return drivers.map(
      (
        driver,
      ) => ({
        ...driver,

        activeVehicleAssignment:
          driver.assignments[0] ??
          null,
      }),
    );
  }


  // ==========================================================
  // GET ONE DRIVER
  // ==========================================================

  async findOne(
    id: string,
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          id,
        },

        include: {
          user: {
            select:
              publicUserSelect,
          },

          cooperative: true,

          assignments: {
            orderBy: {
              assignedAt:
                "desc",
            },

            include: {
              vehicle: true,

              assignedBy: {
                select:
                  publicUserSelect,
              },
            },
          },
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver not found",
      );
    }


    return {
      ...driver,

      activeVehicleAssignment:
        driver.assignments.find(
          (
            assignment,
          ) =>
            assignment.status ===
              AssignmentStatus.ACTIVE &&
            assignment.vehicle.status ===
              "ACTIVE" &&
            assignment.vehicle.deletedAt ===
              null,
        ) ??
        null,
    };
  }


  // ==========================================================
  // GET MY PROFILE
  // ==========================================================

  async findMe(
    userId: string,
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          userId,
        },

        include: {
          user: {
            select:
              publicUserSelect,
          },

          cooperative: true,

          assignments: {
            where: {
              status:
                AssignmentStatus.ACTIVE,

              vehicle: {
                status:
                  "ACTIVE",

                deletedAt:
                  null,
              },
            },

            orderBy: {
              assignedAt:
                "desc",
            },

            take: 1,

            include: {
              vehicle: true,
            },
          },
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver profile not found",
      );
    }


    return {
      ...driver,

      activeVehicleAssignment:
        driver.assignments[0] ??
        null,
    };
  }


  // ==========================================================
  // GET MY TRIPS
  // ==========================================================

  // ==========================================================
// GET MY TRIPS
//
// Also repairs any APPROACHING terminal leg that does not
// yet have a terminal verification token.
// ==========================================================

async findMyTrips(
  userId: string,
) {
  const driver =
    await this.getActiveDriver(
      userId,
    );

  const trips =
    await this.prisma.trip.findMany({
      where: {
        driverId:
          driver.id,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      include:
        driverTripInclude,
    });

  // Repair old APPROACHING legs created before QR generation
  // was enabled.
  for (const trip of trips) {
    for (const leg of trip.legs) {
      if (
        leg.status ===
          TripLegStatus.APPROACHING &&
        leg.destinationType ===
          TripPointType.TERMINAL &&
        !leg.terminalVerificationToken
      ) {
        await this.prisma.tripLeg.update({
          where: {
            id:
              leg.id,
          },

          data: {
            terminalVerificationToken:
              randomUUID(),

            terminalVerificationIssuedAt:
              new Date(),
          },
        });
      }
    }
  }

  // Reload after repairs so the token is included.
  const refreshedTrips =
    await this.prisma.trip.findMany({
      where: {
        driverId:
          driver.id,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      include:
        driverTripInclude,
    });

  return this.attachOperationalState(
    refreshedTrips,
    driver.cooperativeId,
  );
}


// ==========================================================
// GET ONE OF MY TRIPS
//
// Also repairs a missing APPROACHING terminal QR token.
// ==========================================================

async findMyTrip(
  userId: string,
  tripId: string,
) {
  const driver =
    await this.getActiveDriver(
      userId,
    );

  const trip =
    await this.prisma.trip.findFirst({
      where: {
        id:
          tripId,

        driverId:
          driver.id,
      },

      include:
        driverTripInclude,
    });

  if (!trip) {
    throw new NotFoundException(
      "Assigned trip not found",
    );
  }

  const activeApproachingLeg =
    trip.legs.find(
      (leg) =>
        leg.status ===
          TripLegStatus.APPROACHING &&
        leg.destinationType ===
          TripPointType.TERMINAL,
    );

  if (
    activeApproachingLeg &&
    !activeApproachingLeg.terminalVerificationToken
  ) {
    await this.prisma.tripLeg.update({
      where: {
        id:
          activeApproachingLeg.id,
      },

      data: {
        terminalVerificationToken:
          randomUUID(),

        terminalVerificationIssuedAt:
          new Date(),
      },
    });
  }

  const refreshedTrip =
    await this.prisma.trip.findFirst({
      where: {
        id:
          tripId,

        driverId:
          driver.id,
      },

      include:
        driverTripInclude,
    });

  if (!refreshedTrip) {
    throw new NotFoundException(
      "Assigned trip not found",
    );
  }

  const result =
    await this.attachOperationalState(
      [refreshedTrip],
      driver.cooperativeId,
    );

  return result[0];
}

  // ==========================================================
  // DRIVER CREATES OWN TRIP
  //
  // No vehicleId is accepted.
  // Backend automatically uses the active assignment.
  // ==========================================================

  async createMyTrip(
    userId: string,
    dto: {
      routeId: string;
      municipalityId: string;
      tripNumber?: string;
      notes?: string;
    },
  ) {
    const driver =
      await this.getActiveDriver(
        userId,
      );


    const assignment =
      await this.getActiveVehicleAssignment(
        driver.id,
      );


    if (!assignment) {
      throw new BadRequestException(
        "No active vehicle is assigned to this driver",
      );
    }


    const vehicle =
      assignment.vehicle;


    if (
      vehicle.cooperativeId !==
      driver.cooperativeId
    ) {
      throw new BadRequestException(
        "The assigned vehicle does not belong to the driver's cooperative",
      );
    }


    const route =
      await this.prisma.route.findUnique({
        where: {
          id:
            dto.routeId,
        },

        select: {
          id: true,
          originId: true,
          destinationId: true,
          active: true,
        },
      });


    if (!route) {
      throw new NotFoundException(
        "Route not found",
      );
    }


    if (!route.active) {
      throw new BadRequestException(
        "Route is inactive",
      );
    }


    const municipality =
      await this.prisma.municipality.findUnique({
        where: {
          id:
            dto.municipalityId,
        },

        select: {
          id: true,
          active: true,
        },
      });


    if (!municipality) {
      throw new NotFoundException(
        "Municipality not found",
      );
    }


    if (!municipality.active) {
      throw new BadRequestException(
        "Municipality is inactive",
      );
    }


    if (
      route.originId !==
      municipality.id
    ) {
      throw new BadRequestException(
        "Selected municipality must be the route origin",
      );
    }


    const existingActiveTrip =
  await this.prisma.trip.findFirst({
    where: {
      driverId:
        driver.id,

      status: {
        notIn: [
          TripStatus.COMPLETED,
          TripStatus.CANCELLED,
        ],
      },

      legs: {
        some: {
          status: {
            in: [
              TripLegStatus.WAITING,
              TripLegStatus.BOARDING,
              TripLegStatus.EN_ROUTE,
              TripLegStatus.APPROACHING,
            ],
          },
        },
      },
    },

    select: {
      id: true,
      tripNumber: true,
    },
  });


    if (existingActiveTrip) {
      throw new BadRequestException(
        `Driver already has an active trip: ${existingActiveTrip.tripNumber}`,
      );
    }


    const tripNumber =
      dto.tripNumber?.trim() ||
      `DRV-${Date.now()}`;


    const created =
      await this.prisma.$transaction(
        async (tx) => {

          // Municipality queue is cooperative-scoped.
          const latestQueue =
            await tx.queueEntry.findFirst({
              where: {
                status: {
                  in: [
                    "WAITING",
                    "BOARDING",
                  ],
                },

                tripLeg: {
                  legType:
                    TripLegType.OUTBOUND,

                  originType:
                    TripPointType.MUNICIPALITY,

                  destinationType:
                    TripPointType.TERMINAL,

                  status: {
                    in: [
                      TripLegStatus.WAITING,
                      TripLegStatus.BOARDING,
                    ],
                  },

                  trip: {
                    driver: {
                      cooperativeId:
                        driver.cooperativeId,
                    },
                  },
                },
              },

              orderBy: {
                queuePosition:
                  "desc",
              },

              select: {
                queuePosition:
                  true,
              },
            });


          const queuePosition =
            (
              latestQueue
                ?.queuePosition ??
              0
            ) + 1;


          const trip =
            await tx.trip.create({
              data: {
                tripNumber:

                  tripNumber,

                driverId:
                  driver.id,

                vehicleId:
                  vehicle.id,

                routeId:
                  route.id,

                municipalityId:
                  municipality.id,

                direction:
                  "OUTBOUND",

                status:
                  TripStatus.WAITING,

                seatCapacity:
                  vehicle.seatCapacity,

                availableSeats:
                  vehicle.seatCapacity,

                notes:
                  dto.notes ??
                  null,
              },
            });


          const leg =
            await tx.tripLeg.create({
              data: {
                tripId:
                  trip.id,

                legType:
                  TripLegType.OUTBOUND,

                originType:
                  TripPointType.MUNICIPALITY,

                destinationType:
                  TripPointType.TERMINAL,

                status:
                  TripLegStatus.WAITING,
              },
            });


          await tx.queueEntry.create({
            data: {
              tripLegId:
                leg.id,

              queuePosition,

              status:
                "WAITING",
            },
          });


          return trip;
        },
      );


    return this.findMyTrip(
      userId,
      created.id,
    );
  }


  // ==========================================================
  // START BOARDING
  //
  // WAITING -> BOARDING
  // ==========================================================

  async startMyTripBoarding(
    userId: string,
    tripId: string,
  ) {
    const driver =
      await this.getActiveDriver(
        userId,
      );


    const trip =
      await this.prisma.trip.findFirst({
        where: {
          id:
            tripId,

          driverId:
            driver.id,
        },

        include: {
          legs: {
            orderBy: {
              createdAt:
                "desc",
            },

            include: {
              queueEntries: {
                orderBy: {
                  queuePosition:
                    "asc",
                },
              },
            },
          },
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Assigned trip not found",
      );
    }


    const leg =
      trip.legs.find(
        (
          item,
        ) =>
          item.status !==
            TripLegStatus.COMPLETED &&
          item.status !==
            TripLegStatus.CANCELLED,
      );


    if (!leg) {
      throw new BadRequestException(
        "No active trip leg found",
      );
    }


    if (
      leg.status !==
      TripLegStatus.WAITING
    ) {
      throw new BadRequestException(
        `Trip leg must be WAITING before boarding. Current status: ${leg.status}`,
      );
    }


    // --------------------------------------------------------
    // OUTBOUND MUNICIPALITY QUEUE
    // --------------------------------------------------------

    if (
      leg.legType ===
        TripLegType.OUTBOUND &&
      leg.originType ===
        TripPointType.MUNICIPALITY
    ) {
      const queuePosition =
        leg.queueEntries[0]
          ?.queuePosition ??
        null;


      if (
        queuePosition !==
        1
      ) {
        throw new BadRequestException(
          queuePosition
            ? `You are municipality queue position ${queuePosition}. Wait for your turn before boarding.`
            : "You are not currently first in the municipality boarding queue.",
        );
      }
    }


    // --------------------------------------------------------
    // RETURN TERMINAL QUEUE
    // --------------------------------------------------------

    if (
      leg.legType ===
        TripLegType.RETURN &&
      leg.originType ===
        TripPointType.TERMINAL
    ) {
      const terminalState =
        await this.getTerminalQueueStateForTrip(
          leg.id,
          driver.cooperativeId,
        );


      if (
        !terminalState.isFirstTerminalVehicle
      ) {
        throw new BadRequestException(
          terminalState.terminalQueuePosition
            ? `You are terminal queue position ${terminalState.terminalQueuePosition} for your cooperative. Wait for your turn.`
            : "You are not currently first in your cooperative's terminal boarding queue.",
        );
      }
    }


    await this.prisma.$transaction(
      async (tx) => {
        await tx.tripLeg.update({
          where: {
            id:
              leg.id,
          },

          data: {
            status:
              TripLegStatus.BOARDING,

            boardingStartedAt:
              leg.boardingStartedAt ??
              new Date(),
          },
        });


        await tx.trip.update({
          where: {
            id:
              trip.id,
          },

          data: {
            status:
              TripStatus.BOARDING,

            boardingStartedAt:
              trip.boardingStartedAt ??
              new Date(),
          },
        });
      },
    );


    return this.findMyTrip(
      userId,
      tripId,
    );
  }


  // ==========================================================
  // START TRIP
  //
  // BOARDING -> EN_ROUTE
  // ==========================================================

  async startMyTrip(
    userId: string,
    tripId: string,
  ) {
    const driver =
      await this.getActiveDriver(
        userId,
      );


    const trip =
      await this.prisma.trip.findFirst({
        where: {
          id:
            tripId,

          driverId:
            driver.id,
        },

        include: {
          legs: {
            orderBy: {
              createdAt:
                "desc",
            },

            include: {
              boardings: true,
            },
          },
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Assigned trip not found",
      );
    }


    const leg =
      trip.legs.find(
        (
          item,
        ) =>
          item.status !==
            TripLegStatus.COMPLETED &&
          item.status !==
            TripLegStatus.CANCELLED,
      );


    if (!leg) {
      throw new BadRequestException(
        "No active trip leg found",
      );
    }


    if (
      leg.status !==
      TripLegStatus.BOARDING
    ) {
      throw new BadRequestException(
        `Trip leg must be BOARDING before starting. Current status: ${leg.status}`,
      );
    }


    const boardedCount =
      leg.boardings.length;


    if (
      boardedCount <=
      0
    ) {
      throw new BadRequestException(
        "At least one passenger must be boarded before starting the trip",
      );
    }


    await this.prisma.$transaction(
      async (tx) => {

        await tx.tripLeg.update({
          where: {
            id:
              leg.id,
          },

          data: {
            status:
              TripLegStatus.EN_ROUTE,

            startedAt:
              leg.startedAt ??
              new Date(),

            terminalVerificationToken:
              null,

            terminalVerificationIssuedAt:
              null,
          },
        });


        await tx.trip.update({
          where: {
            id:
              trip.id,
          },

          data: {
            status:
              TripStatus.EN_ROUTE,

            startedAt:
              trip.startedAt ??
              new Date(),
          },
        });


        await tx.queueEntry.updateMany({
          where: {
            tripLegId:
              leg.id,
          },

          data: {
            status:
              "DEPARTED",
          },
        });
      },
    );


    return this.findMyTrip(
      userId,
      tripId,
    );
  }


  // ==========================================================
  // EN_ROUTE -> APPROACHING
  //
  // Generates a one-time terminal verification token.
  // ==========================================================

  async updateMyTripStatus(
    userId: string,
    tripId: string,
    nextStatus: TripStatus,
  ) {
    if (
      nextStatus !==
      TripStatus.APPROACHING
    ) {
      throw new BadRequestException(
        "Driver can only change EN_ROUTE to APPROACHING",
      );
    }


    const driver =
      await this.getActiveDriver(
        userId,
      );


    const trip =
      await this.prisma.trip.findFirst({
        where: {
          id:
            tripId,

          driverId:
            driver.id,
        },

        include: {
          legs: {
            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Assigned trip not found",
      );
    }


    const leg =
      trip.legs.find(
        (
          item,
        ) =>
          item.status !==
            TripLegStatus.COMPLETED &&
          item.status !==
            TripLegStatus.CANCELLED,
      );


    if (!leg) {
      throw new BadRequestException(
        "No active trip leg found",
      );
    }


    if (
      leg.status !==
      TripLegStatus.EN_ROUTE
    ) {
      throw new BadRequestException(
        `Trip leg must be EN_ROUTE before approaching. Current status: ${leg.status}`,
      );
    }


    if (
      leg.destinationType !==
      TripPointType.TERMINAL
    ) {
      throw new BadRequestException(
        "Only municipality-to-terminal legs can approach the terminal",
      );
    }


    const terminalVerificationToken =
      randomUUID();


    await this.prisma.$transaction(
      async (tx) => {

        await tx.tripLeg.update({
          where: {
            id:
              leg.id,
          },

          data: {
            status:
              TripLegStatus.APPROACHING,

            approachingAt:
              new Date(),

            terminalVerificationToken,

            terminalVerificationIssuedAt:
              new Date(),
          },
        });


        await tx.trip.update({
          where: {
            id:
              trip.id,
          },

          data: {
            status:
              TripStatus.APPROACHING,
          },
        });
      },
    );


    return this.findMyTrip(
      userId,
      tripId,
    );
  }

// ==========================================================
// DRIVER: MARK TRIP APPROACHING
// ==========================================================

// ==========================================================
// DRIVER: MARK TRIP APPROACHING
//
// EN_ROUTE -> APPROACHING
//
// If the leg is already APPROACHING but has no QR token,
// generate one. This repairs trips created before the QR
// feature was enabled.
// ==========================================================

async markMyTripApproaching(
  userId: string,
  tripId: string,
) {
  const driver =
    await this.getActiveDriver(
      userId,
    );

  const trip =
    await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId: driver.id,
      },

      include: {
        legs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!trip) {
    throw new NotFoundException(
      "Assigned trip not found",
    );
  }

  const leg =
    trip.legs.find(
      (item) =>
        item.status !==
          TripLegStatus.COMPLETED &&
        item.status !==
          TripLegStatus.CANCELLED,
    );

  if (!leg) {
    throw new BadRequestException(
      "No active trip leg found",
    );
  }

  if (
    leg.destinationType !==
    TripPointType.TERMINAL
  ) {
    throw new BadRequestException(
      "Only municipality-to-terminal legs can approach the terminal",
    );
  }

  // Repair an already-APPROACHING leg.
  if (
    leg.status ===
      TripLegStatus.APPROACHING &&
    !leg.terminalVerificationToken
  ) {
    const token =
      randomUUID();

    await this.prisma.tripLeg.update({
      where: {
        id: leg.id,
      },

      data: {
        terminalVerificationToken:
          token,

        terminalVerificationIssuedAt:
          new Date(),
      },
    });

    return this.findMyTrip(
      userId,
      tripId,
    );
  }

  if (
    leg.status !==
    TripLegStatus.EN_ROUTE
  ) {
    throw new BadRequestException(
      `Trip leg must be EN_ROUTE before approaching. Current status: ${leg.status}`,
    );
  }

  const token =
    randomUUID();

  await this.prisma.$transaction(
    async (tx) => {
      await tx.tripLeg.update({
        where: {
          id: leg.id,
        },

        data: {
          status:
            TripLegStatus.APPROACHING,

          approachingAt:
            new Date(),

          terminalVerificationToken:
            token,

          terminalVerificationIssuedAt:
            new Date(),
        },
      });

      await tx.trip.update({
        where: {
          id: trip.id,
        },

        data: {
          status:
            TripStatus.APPROACHING,
        },
      });
    },
  );

  return this.findMyTrip(
    userId,
    tripId,
  );
}



  // ==========================================================
  // ARRIVED AT MUNICIPALITY
  //
  // RETURN EN_ROUTE -> RETURN ARRIVED
  // ==========================================================

  async markMyTripArrived(
    userId: string,
    tripId: string,
  ) {
    const driver =
      await this.getActiveDriver(
        userId,
      );


    const trip =
      await this.prisma.trip.findFirst({
        where: {
          id:
            tripId,

          driverId:
            driver.id,
        },

        include: {
          legs: {
            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Assigned trip not found",
      );
    }


    const leg =
      trip.legs.find(
        (
          item,
        ) =>
          item.status !==
            TripLegStatus.COMPLETED &&
          item.status !==
            TripLegStatus.CANCELLED,
      );


    if (!leg) {
      throw new BadRequestException(
        "No active trip leg found",
      );
    }


    if (
      leg.status !==
      TripLegStatus.EN_ROUTE
    ) {
      throw new BadRequestException(
        `Trip leg must be EN_ROUTE before arrival. Current status: ${leg.status}`,
      );
    }


    if (
      leg.destinationType !==
      TripPointType.MUNICIPALITY
    ) {
      throw new BadRequestException(
        "This arrival operation is only valid for return trips to the municipality",
      );
    }


    await this.prisma.$transaction(
      async (tx) => {

        const now =
          new Date();


        await tx.tripLeg.update({
          where: {
            id:
              leg.id,
          },

          data: {
            status:
              TripLegStatus.ARRIVED,

            arrivedAt:
              now,

            completedAt:
              now,
          },
        });


        await tx.trip.update({
          where: {
            id:
              trip.id,
          },

          data: {
            status:
              TripStatus.COMPLETED,

            arrivedAt:
              now,

            completedAt:
              now,
          },
        });


        await tx.queueEntry.updateMany({
          where: {
            tripLegId:
              leg.id,
          },

          data: {
            status:
              "DEPARTED",
          },
        });
      },
    );


    return this.findMyTrip(
      userId,
      tripId,
    );
  }


  // ==========================================================
  // UPDATE ADMIN DRIVER
  // ==========================================================

  async update(
    id: string,
    dto: UpdateDriverDto,
  ) {
    const existing =
      await this.prisma.driverProfile.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!existing) {
      throw new NotFoundException(
        "Driver not found",
      );
    }


    const updateData:
      Prisma.DriverProfileUpdateInput =
      {};


    if (
      dto.cooperativeId !==
      undefined
    ) {
      const cooperative =
        await this.prisma.cooperative.findUnique({
          where: {
            id:
              dto.cooperativeId,
          },

          select: {
            id: true,
          },
        });


      if (!cooperative) {
        throw new NotFoundException(
          "Cooperative not found",
        );
      }


      updateData.cooperative = {
        connect: {
          id:
            dto.cooperativeId,
        },
      };
    }


    if (
      dto.licenseNumber !==
      undefined
    ) {
      updateData.licenseNumber =
        dto.licenseNumber;
    }


    if (
      dto.licenseExpiry !==
      undefined
    ) {
      updateData.licenseExpiry =
        dto.licenseExpiry
          ? new Date(
              dto.licenseExpiry,
            )
          : null;
    }


    if (
      dto.emergencyContact !==
      undefined
    ) {
      updateData.emergencyContact =
        dto.emergencyContact;
    }


    if (
      dto.emergencyPhone !==
      undefined
    ) {
      updateData.emergencyPhone =
        dto.emergencyPhone;
    }


    if (
      dto.isActive !==
      undefined
    ) {
      updateData.isActive =
        dto.isActive;
    }


    return this.prisma.driverProfile.update({
      where: {
        id,
      },

      data:
        updateData,

      include: {
        user: {
          select:
            publicUserSelect,
        },

        cooperative: true,
      },
    });
  }


  // ==========================================================
  // UPDATE OWN PROFILE
  // ==========================================================

  async updateOwnProfile(
    id: string,
    userId: string,
    dto: UpdateDriverDto,
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          userId: true,
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver not found",
      );
    }


    if (
      driver.userId !==
      userId
    ) {
      throw new ForbiddenException(
        "You can only update your own driver profile",
      );
    }


    const updateData:
      Prisma.DriverProfileUpdateInput =
      {};


    if (
      dto.licenseNumber !==
      undefined
    ) {
      updateData.licenseNumber =
        dto.licenseNumber;
    }


    if (
      dto.licenseExpiry !==
      undefined
    ) {
      updateData.licenseExpiry =
        dto.licenseExpiry
          ? new Date(
              dto.licenseExpiry,
            )
          : null;
    }


    if (
      dto.emergencyContact !==
      undefined
    ) {
      updateData.emergencyContact =
        dto.emergencyContact;
    }


    if (
      dto.emergencyPhone !==
      undefined
    ) {
      updateData.emergencyPhone =
        dto.emergencyPhone;
    }


    return this.prisma.driverProfile.update({
      where: {
        id,
      },

      data:
        updateData,

      include: {
        user: {
          select:
            publicUserSelect,
        },

        cooperative: true,
      },
    });
  }


  // ==========================================================
// REMOVE / DEACTIVATE DRIVER
//
// Drivers with operational history must not be hard-deleted.
// We deactivate the driver and release the active vehicle
// assignment instead.
//
// This preserves:
// - trips
// - vehicle assignments
// - GPS history
// - audit/history records
// ==========================================================

async remove(
  id: string,
) {
  const driver =
    await this.prisma.driverProfile.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            username: true,
            status: true,
          },
        },

        assignments: {
          where: {
            status:
              AssignmentStatus.ACTIVE,
          },

          select: {
            id: true,
            vehicleId: true,
          },
        },
      },
    });


  if (!driver) {
    throw new NotFoundException(
      "Driver not found",
    );
  }


  // ----------------------------------------------------------
  // RELEASE ACTIVE VEHICLE ASSIGNMENTS
  // ----------------------------------------------------------

  await this.prisma.$transaction(
    async (tx) => {
      if (
        driver.assignments.length >
        0
      ) {
        await tx.vehicleAssignment.updateMany({
          where: {
            driverId:
              driver.id,

            status:
              AssignmentStatus.ACTIVE,
          },

          data: {
            status:
              AssignmentStatus.RELEASED,

            releasedAt:
              new Date(),
          },
        });
      }


      // ------------------------------------------------------
      // DEACTIVATE DRIVER PROFILE
      // ------------------------------------------------------

      await tx.driverProfile.update({
        where: {
          id:
            driver.id,
        },

        data: {
          isActive:
            false,
        },
      });


      // ------------------------------------------------------
      // DEACTIVATE LOGIN ACCOUNT
      // ------------------------------------------------------

      if (
        driver.user?.id
      ) {
        await tx.user.update({
          where: {
            id:
              driver.user.id,
          },

          data: {
            status:
              "INACTIVE",
          },
        });
      }
    },
  );


  return {
    success: true,

    message:
      "Driver has been deactivated and the active vehicle assignment has been released.",

    driverId:
      driver.id,

    username:
      driver.user?.username ??
      null,
  };
}


  // ==========================================================
  // GET OWN PROFILE BY ID
  // ==========================================================

  async findOwnProfileById(
    driverProfileId: string,
    userId: string,
  ) {
    const driver =
      await this.findOne(
        driverProfileId,
      );


    if (
      driver.userId !==
      userId
    ) {
      throw new ForbiddenException(
        "You can only access your own driver profile",
      );
    }


    return driver;
  }


  // ==========================================================
  // ACTIVE DRIVER
  // ==========================================================

  private async getActiveDriver(
    userId: string,
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
          cooperativeId: true,
          isActive: true,
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver profile not found",
      );
    }


    if (!driver.isActive) {
      throw new ForbiddenException(
        "Driver profile is inactive",
      );
    }


    return driver;
  }


  // ==========================================================
  // ACTIVE VEHICLE ASSIGNMENT
  // ==========================================================

  private async getActiveVehicleAssignment(
    driverId: string,
  ) {
    return this.prisma.vehicleAssignment.findFirst({
      where: {
        driverId,

        status:
          AssignmentStatus.ACTIVE,

        vehicle: {
          status:
            "ACTIVE",

          deletedAt:
            null,
        },
      },

      orderBy: {
        assignedAt:
          "desc",
      },

      include: {
        vehicle: true,
      },
    });
  }


  // ==========================================================
  // TERMINAL QUEUE
  //
  // Scoped by cooperative.
  // ==========================================================

  private async getTerminalQueueTrips(
    cooperativeId: string,
  ) {
    return this.prisma.tripLeg.findMany({
      where: {
        legType:
          TripLegType.RETURN,

        originType:
          TripPointType.TERMINAL,

        status: {
          in: [
            TripLegStatus.WAITING,
            TripLegStatus.BOARDING,
          ],
        },

        trip: {
          driver: {
            cooperativeId,
          },
        },
      },

      select: {
        id: true,
        status: true,
        createdAt: true,
        trip: {
          select: {
            arrivedAt: true,
          },
        },
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });
  }


  // ==========================================================
  // TERMINAL QUEUE STATE
  // ==========================================================

  private async getTerminalQueueStateForTrip(
    tripLegId: string,
    cooperativeId: string,
  ): Promise<{
    terminalQueuePosition:
      | number
      | null;

    isFirstTerminalVehicle:
      boolean;
  }> {
    const terminalTrips =
      await this.getTerminalQueueTrips(
        cooperativeId,
      );


    const index =
      terminalTrips.findIndex(
        (
          leg,
        ) =>
          leg.id ===
          tripLegId,
      );


    if (
      index ===
      -1
    ) {
      return {
        terminalQueuePosition:
          null,

        isFirstTerminalVehicle:
          false,
      };
    }


    return {
      terminalQueuePosition:
        index + 1,

      isFirstTerminalVehicle:
        index === 0,
    };
  }


  // ==========================================================
  // ATTACH OPERATIONAL STATE
  // ==========================================================

  private async attachOperationalState(
    trips: DriverTrip[],
    cooperativeId: string,
  ) {
    const terminalWaitingLegs =
      await this.getTerminalQueueTrips(
        cooperativeId,
      );


    const terminalPositions =
      new Map<
        string,
        number
      >();


    terminalWaitingLegs.forEach(
      (
        leg,
        index,
      ) => {
        terminalPositions.set(
          leg.id,
          index + 1,
        );
      },
    );


    return trips.map(
      (
        trip,
      ) => {

        const activeLeg =
          trip.legs
            .filter(
              (
                leg,
              ) =>
                leg.status !==
                  TripLegStatus.COMPLETED &&
                leg.status !==
                  TripLegStatus.CANCELLED,
            )
            .sort(
              (
                a,
                b,
              ) =>
                new Date(
                  b.createdAt,
                ).getTime() -
                new Date(
                  a.createdAt,
                ).getTime(),
            )[0] ??
          trip.legs[
            trip.legs.length - 1
          ] ??
          null;


        const position =
          activeLeg
            ? (
                terminalPositions.get(
                  activeLeg.id,
                ) ??
                null
              )
            : null;


        return {
          ...trip,

          currentLeg:
            activeLeg,

          terminalQueuePosition:
            position,

          isFirstTerminalVehicle:
            activeLeg?.legType ===
              TripLegType.RETURN &&
            activeLeg?.originType ===
              TripPointType.TERMINAL &&
            position === 1,
        };
      },
    );
  }
}
