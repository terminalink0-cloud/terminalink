
// apps/api/src/assignments/assignments.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AssignmentStatus,
  Prisma,
  TripLegStatus,
} from "@prisma/client";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateAssignmentDto,
} from "./dto/create-assignment.dto";

import {
  UpdateAssignmentDto,
} from "./dto/update-assignment.dto";


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
// SERVICE
// ============================================================

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}


  // ==========================================================
  // CREATE / ASSIGN VEHICLE
  //
  // Rules:
  // - driver must exist and be active
  // - user must be DRIVER and ACTIVE
  // - vehicle must exist and be ACTIVE
  // - driver and vehicle must belong to same cooperative
  // - driver cannot have an active trip
  // - vehicle cannot be used by an active trip
  // - driver's previous active assignment is released
  // - vehicle's previous active assignment is released
  // - new assignment becomes ACTIVE
  // ==========================================================

  async create(
    dto: CreateAssignmentDto,
  ) {
    const driver =
      await this.prisma.driverProfile.findUnique({
        where: {
          id: dto.driverId,
        },

        select: {
          id: true,
          cooperativeId: true,
          isActive: true,

          user: {
            select: {
              role: true,
              status: true,
            },
          },
        },
      });


    if (!driver) {
      throw new NotFoundException(
        "Driver not found",
      );
    }


    if (!driver.isActive) {
      throw new BadRequestException(
        "Driver profile is inactive",
      );
    }


    if (driver.user.role !== "DRIVER") {
      throw new BadRequestException(
        "Assigned user is not a driver",
      );
    }


    if (driver.user.status !== "ACTIVE") {
      throw new BadRequestException(
        "Driver account is inactive",
      );
    }


    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: dto.vehicleId,
        },

        select: {
          id: true,
          cooperativeId: true,
          status: true,
          deletedAt: true,
        },
      });


    if (!vehicle) {
      throw new NotFoundException(
        "Vehicle not found",
      );
    }


    if (vehicle.deletedAt !== null) {
      throw new BadRequestException(
        "Vehicle has been deleted",
      );
    }


    if (vehicle.status !== "ACTIVE") {
      throw new BadRequestException(
        "Vehicle must be ACTIVE before assignment",
      );
    }


    if (
      driver.cooperativeId !==
      vehicle.cooperativeId
    ) {
      throw new BadRequestException(
        "Driver and vehicle must belong to the same cooperative",
      );
    }


    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------------------
        // DRIVER ACTIVE TRIP CHECK
        // ------------------------------------------------------

        const driverActiveTrip =
          await tx.trip.findFirst({
            where: {
              driverId: driver.id,

              legs: {
                some: {
                  status: {
                    in: [
                      TripLegStatus.WAITING,
                      TripLegStatus.BOARDING,
                      TripLegStatus.EN_ROUTE,
                      TripLegStatus.APPROACHING,
                      TripLegStatus.ARRIVED,
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


        if (driverActiveTrip) {
          throw new BadRequestException(
            `Driver has an active trip (${driverActiveTrip.tripNumber}). Complete the trip before changing vehicle assignment.`,
          );
        }


        // ------------------------------------------------------
        // VEHICLE ACTIVE TRIP CHECK
        // ------------------------------------------------------

        const vehicleActiveTrip =
          await tx.trip.findFirst({
            where: {
              vehicleId: vehicle.id,

              legs: {
                some: {
                  status: {
                    in: [
                      TripLegStatus.WAITING,
                      TripLegStatus.BOARDING,
                      TripLegStatus.EN_ROUTE,
                      TripLegStatus.APPROACHING,
                      TripLegStatus.ARRIVED,
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


        if (vehicleActiveTrip) {
          throw new BadRequestException(
            `Vehicle is currently being used by active trip ${vehicleActiveTrip.tripNumber}.`,
          );
        }


        // ------------------------------------------------------
        // RELEASE DRIVER'S CURRENT ACTIVE ASSIGNMENT
        // ------------------------------------------------------

        await tx.vehicleAssignment.updateMany({
          where: {
            driverId: driver.id,

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


        // ------------------------------------------------------
        // RELEASE VEHICLE'S CURRENT ACTIVE ASSIGNMENT
        // ------------------------------------------------------

        await tx.vehicleAssignment.updateMany({
          where: {
            vehicleId: vehicle.id,

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


        // ------------------------------------------------------
        // CREATE NEW ACTIVE ASSIGNMENT
        // ------------------------------------------------------

        const assignment =
          await tx.vehicleAssignment.create({
            data: {
              driverId:
                driver.id,

              vehicleId:
                vehicle.id,

              status:
                AssignmentStatus.ACTIVE,

              assignedAt:
                new Date(),

              assignedByUserId:
                dto.assignedByUserId ??
                null,

              notes:
                dto.notes ??
                null,
            },

            include: {
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

              assignedBy: {
                select:
                  publicUserSelect,
              },
            },
          });


        return assignment;
      },
    );
  }


  // ==========================================================
  // FIND ALL
  // ==========================================================

  async findAll() {
    return this.prisma.vehicleAssignment.findMany({
      include: {
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

        assignedBy: {
          select:
            publicUserSelect,
        },
      },

      orderBy: [
        {
          status: "asc",
        },

        {
          createdAt: "desc",
        },
      ],
    });
  }


  // ==========================================================
  // FIND ONE
  // ==========================================================

  async findOne(
    id: string,
  ) {
    const assignment =
      await this.prisma.vehicleAssignment.findUnique({
        where: {
          id,
        },

        include: {
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

          assignedBy: {
            select:
              publicUserSelect,
          },
        },
      });


    if (!assignment) {
      throw new NotFoundException(
        "Vehicle assignment not found",
      );
    }


    return assignment;
  }


  // ==========================================================
  // UPDATE
  //
  // Intended mainly for:
  // - releasing an assignment
  // - updating notes
  // ==========================================================

  async update(
    id: string,
    dto: UpdateAssignmentDto,
  ) {
    const existing =
      await this.prisma.vehicleAssignment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
        },
      });


    if (!existing) {
      throw new NotFoundException(
        "Vehicle assignment not found",
      );
    }


    const data:
      Prisma.VehicleAssignmentUpdateInput =
      {};


    if (
      dto.notes !== undefined
    ) {
      data.notes =
        dto.notes;
    }


    if (
      dto.status !== undefined
    ) {
      data.status =
        dto.status;


      if (
        dto.status ===
        AssignmentStatus.RELEASED
      ) {
        data.releasedAt =
          new Date();
      }
    }


    return this.prisma.vehicleAssignment.update({
      where: {
        id,
      },

      data,

      include: {
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

        assignedBy: {
          select:
            publicUserSelect,
        },
      },
    });
  }


  // ==========================================================
  // REMOVE
  // ==========================================================

  async remove(
    id: string,
  ) {
    const existing =
      await this.prisma.vehicleAssignment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
        },
      });


    if (!existing) {
      throw new NotFoundException(
        "Vehicle assignment not found",
      );
    }


    if (
      existing.status ===
      AssignmentStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Release the active assignment before deleting it",
      );
    }


    return this.prisma.vehicleAssignment.delete({
      where: {
        id,
      },
    });
  }
}
