
// apps/api/src/dispatchers/dispatchers.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import {
  GateType,
  Prisma,
  QueueStatus,
  TripLegStatus,
  TripLegType,
  TripPointType,
  TripStatus,
} from "@prisma/client";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateDispatcherDto,
} from "./dto/create-dispatcher.dto";

import {
  UpdateDispatcherDto,
} from "./dto/update-dispatcher.dto";


// ASSUMPTION: bcrypt with 10 salt rounds, matching common Nest/Prisma
// conventions. If the rest of the app hashes passwords differently
// (e.g. argon2, or a different round count in an AuthService/UsersService),
// switch this to match so dispatcher accounts aren't hashed inconsistently
// with everyone else's.
const SALT_ROUNDS = 10;


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


const tripInclude = {
  driver: {
    include: {
      user: {
        select:
          publicUserSelect,
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


type DispatcherTrip =
  Prisma.TripGetPayload<{
    include:
      typeof tripInclude;
  }>;


function buildDisplayName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null,
) {
  return [
    firstName,
    middleName,
    lastName,
  ]
    .filter(
      (part) =>
        !!part &&
        part.trim().length > 0,
    )
    .join(" ");
}


@Injectable()
export class DispatchersService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}


  // ==========================================================
  // DISPATCHER CRUD
  // ==========================================================

  async create(
    dto: CreateDispatcherDto,
  ) {
    const raw =
      dto as unknown as Record<
        string,
        unknown
      >;


    const username =
      typeof raw.username ===
      "string"
        ? raw.username.trim()
        : null;


    const userId =
      typeof raw.userId ===
      "string"
        ? raw.userId
        : null;


    const terminalName =
      typeof raw.terminalName ===
      "string"
        ? raw.terminalName.trim()
        : "";


    if (!terminalName) {
      throw new BadRequestException(
        "Terminal name is required",
      );
    }


    const isActive =
      typeof raw.isActive ===
      "boolean"
        ? raw.isActive
        : true;


    // --------------------------------------------------------
    // PATH 1: ATTACH TO AN EXISTING USER
    //
    // If a userId is given, or the username already belongs to
    // a registered account, reuse that user instead of creating
    // a new one. This supports promoting a user who already has
    // the DISPATCHER role (e.g. provisioned elsewhere) into a
    // dispatcher profile.
    //
    // A userId that doesn't resolve to any user is treated as an
    // error rather than silently falling through to username
    // matching or user creation - the caller asked for a specific
    // account and it doesn't exist.
    // --------------------------------------------------------

    let existingUser:
      | {
          id: string;
          role: string;
          status: string;
        }
      | null =
      null;


    if (userId) {
      existingUser =
        await this.prisma.user.findUnique({
          where: {
            id:
              userId,
          },

          select: {
            id: true,
            role: true,
            status: true,
          },
        });


      if (!existingUser) {
        throw new BadRequestException(
          "No user found for the provided userId.",
        );
      }
    } else if (username) {
      existingUser =
        await this.prisma.user.findUnique({
          where: {
            username,
          },

          select: {
            id: true,
            role: true,
            status: true,
          },
        });
    }


    if (existingUser) {
      if (
        existingUser.role !==
        "DISPATCHER"
      ) {
        throw new BadRequestException(
          "User must have DISPATCHER role",
        );
      }


      if (
        existingUser.status !==
        "ACTIVE"
      ) {
        throw new BadRequestException(
          "Dispatcher user must be ACTIVE",
        );
      }


      const existingProfile =
        await this.prisma.dispatcherProfile.findUnique({
          where: {
            userId:
              existingUser.id,
          },

          select: {
            id: true,
          },
        });


      if (existingProfile) {
        throw new BadRequestException(
          "Dispatcher profile already exists for this user",
        );
      }


      return this.prisma.dispatcherProfile.create({
        data: {
          userId:
            existingUser.id,

          terminalName,

          isActive,
        },

        include: {
          user: {
            select:
              publicUserSelect,
          },
        },
      });
    }


    // --------------------------------------------------------
    // PATH 2: CREATE A BRAND NEW DISPATCHER USER
    //
    // No existing account matched, so this is a genuinely new
    // dispatcher. Provision the User (role DISPATCHER, status
    // ACTIVE) and its DispatcherProfile together in a single
    // transaction so we never end up with one but not the other.
    // --------------------------------------------------------

    if (!username) {
      throw new BadRequestException(
        "Username is required to create a new dispatcher.",
      );
    }


    const password =
      typeof raw.password ===
      "string"
        ? raw.password
        : "";


    if (
      !password ||
      password.length < 6
    ) {
      throw new BadRequestException(
        "Password must be at least 6 characters.",
      );
    }


    const firstName =
      typeof raw.firstName ===
      "string"
        ? raw.firstName.trim()
        : "";


    const lastName =
      typeof raw.lastName ===
      "string"
        ? raw.lastName.trim()
        : "";


    if (
      !firstName ||
      !lastName
    ) {
      throw new BadRequestException(
        "First name and last name are required.",
      );
    }


    const middleName =
      typeof raw.middleName ===
        "string" &&
      raw.middleName.trim()
        .length > 0
        ? raw.middleName.trim()
        : null;


    const email =
      typeof raw.email ===
        "string" &&
      raw.email.trim()
        .length > 0
        ? raw.email.trim()
        : null;


    const phone =
      typeof raw.phone ===
        "string" &&
      raw.phone.trim()
        .length > 0
        ? raw.phone.trim()
        : null;


    const passwordHash =
      await bcrypt.hash(
        password,
        SALT_ROUNDS,
      );


    const displayName =
      buildDisplayName(
        firstName,
        middleName,
        lastName,
      );


    // Loosely typed like the rest of this file's DTO handling,
    // to sidestep strict Prisma enum typing for role/status -
    // matches the existing `{ role: string; status: string }`
    // pattern used above for `existingUser`.
    const newUserData: Record<
      string,
      unknown
    > = {
      username,

      passwordHash,

      role: "DISPATCHER",

      status: "ACTIVE",

      firstName,
      middleName,
      lastName,
      displayName,

      email,
      phone,
    };


    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data:
                newUserData as Prisma.UserCreateInput,
            });


          return tx.dispatcherProfile.create({
            data: {
              userId:
                user.id,

              terminalName,

              isActive,
            },

            include: {
              user: {
                select:
                  publicUserSelect,
              },
            },
          });
        },
      );
    } catch (err: any) {
      if (
        err?.code ===
        "P2002"
      ) {
        throw new BadRequestException(
          "A user with this username, email, or phone already exists.",
        );
      }


      throw err;
    }
  }


  async findAll() {
    return this.prisma.dispatcherProfile.findMany({
      include: {
        user: {
          select:
            publicUserSelect,
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });
  }


  async findOne(
    id: string,
  ) {
    const dispatcher =
      await this.prisma.dispatcherProfile.findUnique({
        where: {
          id,
        },

        include: {
          user: {
            select:
              publicUserSelect,
          },
        },
      });


    if (!dispatcher) {
      throw new NotFoundException(
        "Dispatcher not found",
      );
    }


    return dispatcher;
  }


  async update(
    id: string,
    dto: UpdateDispatcherDto,
  ) {
    const existing =
      await this.prisma.dispatcherProfile.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          user: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
        },
      });


    if (!existing) {
      throw new NotFoundException(
        "Dispatcher not found",
      );
    }


    const raw =
      dto as unknown as Record<
        string,
        unknown
      >;


    const data:
      Prisma.DispatcherProfileUpdateInput =
      {};


    if (
      typeof raw.terminalName ===
      "string"
    ) {
      data.terminalName =
        raw.terminalName.trim();
    }


    if (
      typeof raw.isActive ===
      "boolean"
    ) {
      data.isActive =
        raw.isActive;
    }


    // --------------------------------------------------------
    // USER-OWNED FIELDS
    //
    // firstName / middleName / lastName / email / phone all live
    // on the related User, not on DispatcherProfile. Previously
    // these were accepted by validation but silently dropped -
    // they're now applied as a nested update. displayName is
    // recomputed whenever any name part changes, using the
    // existing values for parts that weren't sent.
    // --------------------------------------------------------

    const userData: Prisma.UserUpdateInput =
      {};


    let firstName =
      existing.user.firstName;

    let middleName =
      existing.user.middleName;

    let lastName =
      existing.user.lastName;

    let nameChanged =
      false;


    if (
      typeof raw.firstName ===
      "string"
    ) {
      firstName =
        raw.firstName.trim();

      userData.firstName =
        firstName;

      nameChanged = true;
    }


    if (
      typeof raw.middleName ===
      "string"
    ) {
      middleName =
        raw.middleName.trim() ||
        null;

      userData.middleName =
        middleName;

      nameChanged = true;
    }


    if (
      typeof raw.lastName ===
      "string"
    ) {
      lastName =
        raw.lastName.trim();

      userData.lastName =
        lastName;

      nameChanged = true;
    }


    if (nameChanged) {
      userData.displayName =
        buildDisplayName(
          firstName,
          middleName,
          lastName,
        );
    }


    if (
      typeof raw.email ===
      "string"
    ) {
      userData.email =
        raw.email.trim() ||
        null;
    }


    if (
      typeof raw.phone ===
      "string"
    ) {
      userData.phone =
        raw.phone.trim() ||
        null;
    }


    if (
      Object.keys(
        userData,
      ).length > 0
    ) {
      data.user = {
        update:
          userData,
      };
    }


    try {
      return await this.prisma.dispatcherProfile.update({
        where: {
          id,
        },

        data,

        include: {
          user: {
            select:
              publicUserSelect,
          },
        },
      });
    } catch (err: any) {
      if (
        err?.code ===
        "P2002"
      ) {
        throw new BadRequestException(
          "A user with this email or phone already exists.",
        );
      }


      throw err;
    }
  }


  async remove(
    id: string,
  ) {
    const existing =
      await this.prisma.dispatcherProfile.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!existing) {
      throw new NotFoundException(
        "Dispatcher not found",
      );
    }


    return this.prisma.dispatcherProfile.delete({
      where: {
        id,
      },
    });
  }


  // ==========================================================
  // OPERATIONS DASHBOARD
  // ==========================================================

  async getOperationsDashboard(
    _userId?: string,
  ) {
    const [
      waiting,
      boarding,
      departed,
      completed,
    ] =
      await Promise.all([
        this.prisma.trip.count({
          where: {
            status:
              TripStatus.WAITING,
          },
        }),

        this.prisma.trip.count({
          where: {
            status:
              TripStatus.BOARDING,
          },
        }),

        this.prisma.trip.count({
          where: {
            status:
              TripStatus.DEPARTED,
          },
        }),

        this.prisma.trip.count({
          where: {
            status:
              TripStatus.COMPLETED,
          },
        }),
      ]);


    return {
      waiting,
      boarding,
      departed,
      completed,
    };
  }


  async getDispatcherDashboard() {
    return this.getOperationsDashboard();
  }


  // ==========================================================
  // INCOMING TRIPS
  // ==========================================================

  async getIncomingTrips() {
    const trips =
      await this.prisma.trip.findMany({
        where: {
          status: {
            in: [
              TripStatus.APPROACHING,
              TripStatus.DOCKED,
              TripStatus.BOARDING,
              TripStatus.DEPARTED,
              TripStatus.COMPLETED,
            ],
          },
        },

        orderBy: {
          updatedAt:
            "desc",
        },

        include:
          tripInclude,
      });


    return trips.map(
      (
        trip,
      ) =>
        this.attachDispatcherState(
          trip,
        ),
    );
  }


  async findTrip(
    tripId: string,
  ) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            tripId,
        },

        include:
          tripInclude,
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    return this.attachDispatcherState(
      trip,
    );
  }


  // ==========================================================
  // COMPATIBILITY STATUS UPDATE
  // ==========================================================

  async updateTripStatus(
    userId: string,
    tripId: string,
    nextStatus: TripStatus,
  ) {
    const dispatcher =
      await this.getActiveDispatcher(
        userId,
      );


    if (
      nextStatus ===
      TripStatus.APPROACHING
    ) {
      return this.markTripApproaching(
        tripId,
        dispatcher.id,
      );
    }


    if (
      nextStatus ===
      TripStatus.DOCKED
    ) {
      const trip =
        await this.prisma.trip.findUnique({
          where: {
            id:
              tripId,
          },

          include:
            tripInclude,
        });


      if (!trip) {
        throw new NotFoundException(
          "Trip not found",
        );
      }


      return this.prisma.trip.update({
        where: {
          id:
            tripId,
        },

        data: {
          status:
            TripStatus.DOCKED,
        },

        include:
          tripInclude,
      });
    }


    throw new BadRequestException(
      `Dispatcher cannot directly set trip status to ${nextStatus}`,
    );
  }


  // ==========================================================
  // LEGACY DISPATCHER APPROACHING
  //
  // Kept for compatibility, but the driver is the owner
  // of the APPROACHING transition.
  // ==========================================================

  async markTripApproaching(
    tripId: string,
    dispatcherId: string,
  ) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            tripId,
        },

        include:
          tripInclude,
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const currentLeg =
      this.getCurrentLeg(
        trip,
      );


    if (!currentLeg) {
      throw new BadRequestException(
        "Trip has no current operational leg",
      );
    }


    if (
      currentLeg.legType !==
      TripLegType.OUTBOUND
    ) {
      throw new BadRequestException(
        "Only outbound legs can approach the terminal",
      );
    }


    if (
      currentLeg.destinationType !==
      TripPointType.TERMINAL
    ) {
      throw new BadRequestException(
        "Current leg is not terminal-bound",
      );
    }


    if (
      currentLeg.status ===
      TripLegStatus.APPROACHING
    ) {
      return this.findTrip(
        tripId,
      );
    }


    if (
      currentLeg.status !==
      TripLegStatus.EN_ROUTE
    ) {
      throw new BadRequestException(
        `Trip leg must be EN_ROUTE before APPROACHING. Current status: ${currentLeg.status}`,
      );
    }


    throw new BadRequestException(
      "The driver must mark the trip as APPROACHING. Dispatcher verification begins after the driver displays the terminal QR.",
    );
  }


  // ==========================================================
  // TERMINAL ARRIVAL / TERMINAL QR VERIFICATION
  //
  // Driver creates:
  //
  // terminalVerificationToken
  //
  // when entering APPROACHING.
  //
  // Dispatcher sends that token here.
  //
  // The token is checked against the CURRENT LEG, never
  // against Vehicle.qrToken.
  // ==========================================================

  async markTripArrived(
    tripId: string,
    dispatcherUserId: string,
    verificationToken?: string,
  ) {
    const dispatcher =
      await this.getActiveDispatcher(
        dispatcherUserId,
      );


    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            tripId,
        },

        include:
          tripInclude,
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const currentLeg =
      this.getCurrentLeg(
        trip,
      );


    if (!currentLeg) {
      throw new BadRequestException(
        "Trip has no current operational leg",
      );
    }


    if (
      currentLeg.legType !==
      TripLegType.OUTBOUND
    ) {
      throw new BadRequestException(
        "Only an outbound leg can arrive at the terminal",
      );
    }


    if (
      currentLeg.destinationType !==
      TripPointType.TERMINAL
    ) {
      throw new BadRequestException(
        "Current leg is not terminal-bound",
      );
    }


    if (
      currentLeg.status !==
      TripLegStatus.APPROACHING
    ) {
      throw new BadRequestException(
        `Trip must be APPROACHING before terminal arrival. Current status: ${currentLeg.status}`,
      );
    }


    if (
      !verificationToken ||
      !verificationToken.trim()
    ) {
      throw new BadRequestException(
        "Terminal verification QR token is required.",
      );
    }


    const token =
      verificationToken.trim();


    if (
      !currentLeg.terminalVerificationToken
    ) {
      throw new BadRequestException(
        "This trip does not have an active terminal verification QR.",
      );
    }


    if (
      currentLeg.terminalVerificationToken !==
      token
    ) {
      throw new BadRequestException(
        "This QR code does not match the terminal verification QR issued for this trip.",
      );
    }


    const existingReturn =
      trip.legs.find(
        (
          leg,
        ) =>
          leg.legType ===
          TripLegType.RETURN,
      );


    if (existingReturn) {
      throw new BadRequestException(
        "Return leg already exists for this trip",
      );
    }


    const now =
      new Date();


    const result =
      await this.prisma.$transaction(
        async (tx) => {

          // ----------------------------------------------------
          // OUTBOUND ARRIVED
          // ----------------------------------------------------

          await tx.tripLeg.update({
            where: {
              id:
                currentLeg.id,
            },

            data: {
              status:
                TripLegStatus.ARRIVED,

              arrivedAt:
                now,

              // One-time QR.
              terminalVerificationToken:
                null,

              terminalVerificationIssuedAt:
                null,
            },
          });


          // ----------------------------------------------------
          // CREATE RETURN LEG
          // ----------------------------------------------------

          const returnLeg =
            await tx.tripLeg.create({
              data: {
                tripId:
                  trip.id,

                legType:
                  TripLegType.RETURN,

                originType:
                  TripPointType.TERMINAL,

                destinationType:
                  TripPointType.MUNICIPALITY,

                status:
                  TripLegStatus.WAITING,
              },
            });


          // ----------------------------------------------------
          // FIND NEXT COOPERATIVE TERMINAL QUEUE POSITION
          // ----------------------------------------------------

          const latestQueue =
            await tx.queueEntry.findFirst({
              where: {
                status: {
                  in: [
                    QueueStatus.WAITING,
                    QueueStatus.BOARDING,
                  ],
                },

                tripLeg: {
                  legType:
                    TripLegType.RETURN,

                  originType:
                    TripPointType.TERMINAL,

                  destinationType:
                    TripPointType.MUNICIPALITY,

                  status: {
                    in: [
                      TripLegStatus.WAITING,
                      TripLegStatus.BOARDING,
                    ],
                  },

                  trip: {
                    driver: {
                      cooperativeId:
                        trip.driver
                          .cooperativeId,
                    },
                  },
                },
              },

              orderBy: [
                {
                  queuePosition:
                    "desc",
                },

                {
                  createdAt:
                    "desc",
                },
              ],

              select: {
                queuePosition:
                  true,
              },
            });


          const nextPosition =
            (
              latestQueue
                ?.queuePosition ??
              0
            ) + 1;


          // ----------------------------------------------------
          // CREATE RETURN QUEUE
          // ----------------------------------------------------

          await tx.queueEntry.create({
            data: {
              tripLegId:
                returnLeg.id,

              queuePosition:
                nextPosition,

              status:
                QueueStatus.WAITING,
            },
          });


          // ----------------------------------------------------
          // PARENT TRIP
          // ----------------------------------------------------

          await tx.trip.update({
  where: {
    id: trip.id,
  },

  data: {
    status:
      TripStatus.DOCKED,

    arrivedAt:
      now,

    availableSeats:
      trip.seatCapacity,
  },
});


          // ----------------------------------------------------
          // GATE EVENT
          // ----------------------------------------------------

          await tx.gateEvent.create({
            data: {
              tripId:
                trip.id,

              dispatcherId:
                dispatcher.id,

              gateType:
                GateType.INBOUND,

              remarks:
                `Terminal verification QR accepted. Vehicle ${trip.vehicle.plateNumber} arrived. Return queue position ${nextPosition}.`,
            },
          });


          return tx.trip.findUnique({
            where: {
              id:
                trip.id,
            },

            include:
              tripInclude,
          });
        },
      );


    if (!result) {
      throw new NotFoundException(
        "Updated trip not found",
      );
    }


    return this.attachDispatcherState(
      result,
    );
  }


  // ==========================================================
  // DRIVER-OWNED BOARDING
  // ==========================================================

  async startBoarding(
    _userId: string,
    _tripId: string,
  ) {
    throw new BadRequestException(
      "Passenger boarding belongs to the driver.",
    );
  }


  // ==========================================================
  // DRIVER-OWNED DEPARTURE
  // ==========================================================

  async departTrip(
    _userId: string,
    _tripId: string,
    _confirmUnfilledSeats = false,
  ) {
    throw new BadRequestException(
      "Trip departure belongs to the driver.",
    );
  }


  // ==========================================================
  // COMPLETE RETURN TRIP
  // ==========================================================

  async completeTrip(
    tripId: string,
    _dispatcherUserId?: string,
  ) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id:
            tripId,
        },

        include:
          tripInclude,
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const currentLeg =
      this.getCurrentLeg(
        trip,
      );


    if (!currentLeg) {
      throw new BadRequestException(
        "Trip has no current operational leg",
      );
    }


    if (
      currentLeg.legType !==
      TripLegType.RETURN
    ) {
      throw new BadRequestException(
        "Only the return leg can complete the overall trip",
      );
    }


    if (
      currentLeg.destinationType !==
      TripPointType.MUNICIPALITY
    ) {
      throw new BadRequestException(
        "Return leg destination must be the municipality",
      );
    }


    if (
      currentLeg.status !==
      TripLegStatus.ARRIVED
    ) {
      throw new BadRequestException(
        `Return leg must be ARRIVED before completion. Current status: ${currentLeg.status}`,
      );
    }


    const now =
      new Date();


    const completed =
      await this.prisma.$transaction(
        async (tx) => {

          await tx.tripLeg.update({
            where: {
              id:
                currentLeg.id,
            },

            data: {
              status:
                TripLegStatus.COMPLETED,

              completedAt:
                now,
            },
          });


          return tx.trip.update({
            where: {
              id:
                trip.id,
            },

            data: {
              status:
                TripStatus.COMPLETED,

              completedAt:
                now,
            },

            include:
              tripInclude,
          });
        },
      );


    return this.attachDispatcherState(
      completed,
    );
  }


  // ==========================================================
  // TERMINAL QUEUE POSITION
  // ==========================================================

  async getTerminalQueuePosition(
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

          driver: {
            select: {
              cooperativeId:
                true,
            },
          },

          legs: {
            where: {
              legType:
                TripLegType.RETURN,

              status: {
                in: [
                  TripLegStatus.WAITING,
                  TripLegStatus.BOARDING,
                ],
              },
            },

            orderBy: {
              createdAt:
                "desc",
            },

            take: 1,

            select: {
              id: true,
            },
          },
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const returnLeg =
      trip.legs[0];


    if (!returnLeg) {
      return {
        terminalQueuePosition:
          null,

        isFirstTerminalVehicle:
          false,
      };
    }


    const entries =
      await this.prisma.queueEntry.findMany({
        where: {
          status: {
            in: [
              QueueStatus.WAITING,
              QueueStatus.BOARDING,
            ],
          },

          tripLeg: {
            legType:
              TripLegType.RETURN,

            originType:
              TripPointType.TERMINAL,

            destinationType:
              TripPointType.MUNICIPALITY,

            status: {
              in: [
                TripLegStatus.WAITING,
                TripLegStatus.BOARDING,
              ],
            },

            trip: {
              driver: {
                cooperativeId:
                  trip.driver.cooperativeId,
              },
            },
          },
        },

        orderBy: [
          {
            queuePosition:
              "asc",
          },

          {
            createdAt:
              "asc",
          },
        ],

        select: {
          tripLegId:
            true,

          queuePosition:
            true,
        },
      });


    const index =
      entries.findIndex(
        (
          entry,
        ) =>
          entry.tripLegId ===
          returnLeg.id,
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
  // ACTIVE DISPATCHER
  // ==========================================================

  private async getActiveDispatcher(
    userId: string,
  ) {
    const dispatcher =
      await this.prisma.dispatcherProfile.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
          isActive: true,
        },
      });


    if (!dispatcher) {
      throw new NotFoundException(
        "Dispatcher profile not found",
      );
    }


    if (!dispatcher.isActive) {
      throw new ForbiddenException(
        "Dispatcher profile is inactive",
      );
    }


    return dispatcher;
  }


  // ==========================================================
  // CURRENT LEG
  // ==========================================================

  private getCurrentLeg(
    trip: DispatcherTrip,
  ) {
    return (
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
            b.createdAt.getTime() -
            a.createdAt.getTime(),
        )[0] ??
      null
    );
  }


  // ==========================================================
  // ATTACH CURRENT STATE
  // ==========================================================

  private attachDispatcherState(
    trip: DispatcherTrip,
  ) {
    const currentLeg =
      this.getCurrentLeg(
        trip,
      );


    const queuePosition =
      currentLeg &&
      currentLeg.legType ===
        TripLegType.RETURN &&
      currentLeg.originType ===
        TripPointType.TERMINAL
        ? (
            currentLeg
              .queueEntries[0]
              ?.queuePosition ??
            null
          )
        : null;


    return {
      ...trip,

      currentLeg,

      terminalQueuePosition:
        queuePosition,

      isFirstTerminalVehicle:
        queuePosition === 1,
    };
  }
}
