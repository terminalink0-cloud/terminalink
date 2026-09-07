
// apps/api/src/boarding/boarding.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  Prisma,
  TripLegStatus,
} from "@prisma/client";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateBoardingDto,
} from "./dto/create-boarding.dto";


@Injectable()
export class BoardingService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}


  // ==========================================================
  // BOARD PASSENGER
  //
  // IMPORTANT:
  // Passenger counts belong to the CURRENT TripLeg.
  // The parent Trip.availableSeats is kept synchronized with
  // the current operational leg.
  // ==========================================================

  async create(
    dto: CreateBoardingDto,
    updatedByUserId: string,
  ) {
    const passengerName =
      dto.passengerName?.trim();


    if (!passengerName) {
      throw new BadRequestException(
        "Passenger name is required",
      );
    }


    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------------
        // FIND TRIP
        // ------------------------------------------------------

        const trip =
          await tx.trip.findUnique({
            where: {
              id:
                dto.tripId,
            },

            select: {
              id: true,
              tripNumber: true,
              seatCapacity: true,
              availableSeats: true,
              status: true,
              vehicleId: true,
            },
          });


        if (!trip) {
          throw new NotFoundException(
            "Trip not found",
          );
        }


        // ------------------------------------------------------
        // FIND CURRENT BOARDING LEG
        // ------------------------------------------------------

        const leg =
          await tx.tripLeg.findFirst({
            where: {
              tripId:
                trip.id,

              status:
                TripLegStatus.BOARDING,
            },

            orderBy: {
              createdAt:
                "desc",
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
          throw new BadRequestException(
            "Trip does not have an active boarding leg",
          );
        }


        // ------------------------------------------------------
        // PARENT TRIP MUST ALSO BE BOARDING
        // ------------------------------------------------------

        if (
          trip.status !==
          "BOARDING"
        ) {
          throw new BadRequestException(
            `Trip is not accepting passengers. Current status: ${trip.status}`,
          );
        }


        // ------------------------------------------------------
        // COUNT PASSENGERS ON THIS LEG ONLY
        // ------------------------------------------------------

        const boardedCount =
          await tx.boarding.count({
            where: {
              tripLegId:
                leg.id,
            },
          });


        const availableSeats =
          Math.max(
            trip.seatCapacity -
              boardedCount,
            0,
          );


        if (
          availableSeats <=
          0
        ) {
          throw new BadRequestException(
            "No available seats",
          );
        }


        // ------------------------------------------------------
        // SEAT VALIDATION
        // ------------------------------------------------------

        let seatNumber =
          dto.seatNumber;


        if (
          seatNumber !==
          undefined
        ) {
          if (
            !Number.isInteger(
              seatNumber,
            )
          ) {
            throw new BadRequestException(
              "Seat number must be an integer",
            );
          }


          if (
            seatNumber < 1 ||
            seatNumber >
              trip.seatCapacity
          ) {
            throw new BadRequestException(
              `Seat number must be between 1 and ${trip.seatCapacity}`,
            );
          }


          const existingSeat =
            await tx.boarding.findFirst({
              where: {
                tripLegId:
                  leg.id,

                seatNumber,
              },

              select: {
                id: true,
              },
            });


          if (existingSeat) {
            throw new BadRequestException(
              `Seat ${seatNumber} is already occupied on this trip leg`,
            );
          }
        } else {
          // ----------------------------------------------------
          // AUTOMATIC SEAT ASSIGNMENT
          // CURRENT LEG ONLY
          // ----------------------------------------------------

          const occupied =
            await tx.boarding.findMany({
              where: {
                tripLegId:
                  leg.id,

                seatNumber: {
                  not: null,
                },
              },

              select: {
                seatNumber: true,
              },
            });


          const occupiedSeats =
            new Set(
              occupied
                .map(
                  (
                    item,
                  ) =>
                    item.seatNumber,
                )
                .filter(
                  (
                    value,
                  ): value is number =>
                    value !== null,
                ),
            );


          for (
            let seat = 1;
            seat <=
              trip.seatCapacity;
            seat++
          ) {
            if (
              !occupiedSeats.has(
                seat,
              )
            ) {
              seatNumber =
                seat;

              break;
            }
          }


          if (
            seatNumber ===
            undefined
          ) {
            throw new BadRequestException(
              "No seat is available",
            );
          }
        }


        // ------------------------------------------------------
        // CREATE BOARDING
        // ------------------------------------------------------

        const boarding =
          await tx.boarding.create({
            data: {
              tripId:
                trip.id,

              tripLegId:
                leg.id,

              passengerName,

              seatNumber,
            },
          });


        // ------------------------------------------------------
        // RECALCULATE CURRENT LEG AVAILABILITY
        // ------------------------------------------------------

        const newBoardedCount =
          boardedCount + 1;


        const newAvailableSeats =
          Math.max(
            trip.seatCapacity -
              newBoardedCount,
            0,
          );


        // ------------------------------------------------------
        // UPDATE PARENT TRIP
        // ------------------------------------------------------

        const seatUpdate =
          await tx.trip.updateMany({
            where: {
              id:
                trip.id,

              status:
                "BOARDING",
            },

            data: {
              availableSeats:
                newAvailableSeats,
            },
          });


        if (
          seatUpdate.count !==
          1
        ) {
          throw new BadRequestException(
            "Unable to update available seats",
          );
        }


        // ------------------------------------------------------
        // SEAT AUDIT
        // ------------------------------------------------------

        await tx.seatHistory.create({
          data: {
            tripId:
              trip.id,

            previousAvailableSeats:
              availableSeats,

            newAvailableSeats:
              newAvailableSeats,

            updatedByUserId:
              updatedByUserId,
          },
        });


        // ------------------------------------------------------
        // RESULT
        // ------------------------------------------------------

        return {
          boarding,

          tripId:
            trip.id,

          tripLegId:
            leg.id,

          tripNumber:
            trip.tripNumber,

          legType:
            leg.legType,

          originType:
            leg.originType,

          destinationType:
            leg.destinationType,

          seatCapacity:
            trip.seatCapacity,

          boardedCount:
            newBoardedCount,

          remainingSeats:
            newAvailableSeats,

          updatedByUserId,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }


  // ==========================================================
  // LIST CURRENT LEG BOARDINGS
  // ==========================================================

  async findTripBoardings(
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
          tripNumber: true,
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const currentLeg =
      await this.prisma.tripLeg.findFirst({
        where: {
          tripId,

          status:
            TripLegStatus.BOARDING,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        select: {
          id: true,
        },
      });


    if (!currentLeg) {
      return [];
    }


    return this.prisma.boarding.findMany({
      where: {
        tripLegId:
          currentLeg.id,
      },

      select: {
        id: true,
        tripId: true,
        tripLegId: true,
        passengerName: true,
        seatNumber: true,
        boardedAt: true,
      },

      orderBy: {
        boardedAt:
          "asc",
      },
    });
  }


  // ==========================================================
  // LIST BOARDINGS FOR SPECIFIC LEG
  // ==========================================================

  async findLegBoardings(
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
        },
      });


    if (!leg) {
      throw new NotFoundException(
        "Trip leg not found",
      );
    }


    return this.prisma.boarding.findMany({
      where: {
        tripLegId,
      },

      select: {
        id: true,
        tripId: true,
        tripLegId: true,
        passengerName: true,
        seatNumber: true,
        boardedAt: true,
      },

      orderBy: {
        boardedAt:
          "asc",
      },
    });
  }


  // ==========================================================
  // BOARDING SUMMARY
  //
  // IMPORTANT:
  // Availability is calculated from the CURRENT TripLeg.
  // It does not inherit the outbound passenger count.
  // ==========================================================

  async getTripBoardingSummary(
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
          tripNumber: true,
          status: true,
          seatCapacity: true,
        },
      });


    if (!trip) {
      throw new NotFoundException(
        "Trip not found",
      );
    }


    const leg =
      await this.prisma.tripLeg.findFirst({
        where: {
          tripId,

          status:
            TripLegStatus.BOARDING,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        select: {
          id: true,
          legType: true,
          status: true,
          originType: true,
          destinationType: true,
        },
      });


    if (!leg) {
      return {
        tripId:
          trip.id,

        tripNumber:
          trip.tripNumber,

        tripLegId:
          null,

        legType:
          null,

        originType:
          null,

        destinationType:
          null,

        status:
          trip.status,

        seatCapacity:
          trip.seatCapacity,

        boardedCount:
          0,

        availableSeats:
          trip.seatCapacity,

        isFull:
          false,

        boardings:
          [],

        latestBoardingAudit:
          null,
      };
    }


    const [
      boardings,
      latestHistory,
    ] =
      await Promise.all([
        this.prisma.boarding.findMany({
          where: {
            tripLegId:
              leg.id,
          },

          select: {
            id: true,
            tripId: true,
            tripLegId: true,
            passengerName: true,
            seatNumber: true,
            boardedAt: true,
          },

          orderBy: {
            boardedAt:
              "asc",
          },
        }),

        this.prisma.seatHistory.findFirst({
          where: {
            tripId:
              trip.id,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          select: {
            id: true,
            previousAvailableSeats: true,
            newAvailableSeats: true,
            updatedByUserId: true,
            createdAt: true,
          },
        }),
      ]);


    const boardedCount =
      boardings.length;


    const availableSeats =
      Math.max(
        trip.seatCapacity -
          boardedCount,
        0,
      );


    let dispatcher:
      {
        id: string;
        username: string;
        role: string;
        displayName: string;
      } | null =
      null;


    if (
      latestHistory?.updatedByUserId
    ) {
      dispatcher =
        await this.prisma.user.findUnique({
          where: {
            id:
              latestHistory.updatedByUserId,
          },

          select: {
            id: true,
            username: true,
            role: true,
            displayName: true,
          },
        });
    }


    return {
      tripId:
        trip.id,

      tripNumber:
        trip.tripNumber,

      tripLegId:
        leg.id,

      legType:
        leg.legType,

      originType:
        leg.originType,

      destinationType:
        leg.destinationType,

      status:
        leg.status,

      seatCapacity:
        trip.seatCapacity,

      boardedCount,

      availableSeats,

      isFull:
        availableSeats ===
        0,

      boardings,

      latestBoardingAudit:
        latestHistory
          ? {
              id:
                latestHistory.id,

              previousAvailableSeats:
                latestHistory.previousAvailableSeats,

              newAvailableSeats:
                latestHistory.newAvailableSeats,

              updatedByUserId:
                latestHistory.updatedByUserId,

              createdAt:
                latestHistory.createdAt,

              dispatcher,
            }
          : null,
    };
  }
}
