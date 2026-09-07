// apps/api/src/drivers/driver-operations.controller.ts

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import type {
  Request,
} from "express";

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import {
  UserRole,
} from "@prisma/client";

import {
  DriversService,
} from "./drivers.service";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


// ============================================================
// REQUEST TYPES
// ============================================================

type AuthenticatedUser = {
  sub?: string;
  id?: string;
  role?: UserRole | string;
};


// ============================================================
// CREATE DRIVER TRIP DTO
//
// Driver does NOT send driverId or vehicleId.
//
// The backend derives both from the authenticated driver.
// ============================================================

class CreateDriverTripDto {

  routeId!: string;

  municipalityId!: string;

  tripNumber?: string;

  notes?: string;
}


// ============================================================
// CONTROLLER
// ============================================================

@ApiTags("Driver Operations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("driver")
export class DriverOperationsController {

  constructor(
    private readonly driversService:
      DriversService,
  ) {}


  // ==========================================================
  // GET MY TRIPS
  // ==========================================================

  @Get("trips")
  @ApiOperation({
    summary:
      "Get trips created/owned by authenticated driver",
  })
  getMyTrips(
    @Req() req: Request,
  ) {
    this.requireDriver(req);

    return this.driversService.findMyTrips(
      this.getUserId(req),
    );
  }


  // ==========================================================
  // GET ONE MY TRIP
  // ==========================================================

  @Get("trips/:tripId")
  @ApiOperation({
    summary:
      "Get one driver's trip",
  })
  getMyTrip(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDriver(req);

    return this.driversService.findMyTrip(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // CREATE MY TRIP
  //
  // DRIVER OWNS THIS ACTION.
  //
  // No driverId is accepted from the browser.
  // No vehicleId is accepted from the browser.
  //
  // Backend derives:
  //   driver = authenticated driver
  //   vehicle = driver's active assignment
  // ==========================================================

  @Post("trips")
  @ApiOperation({
    summary:
      "Create outbound trip for authenticated driver",
  })
  createMyTrip(
    @Req() req: Request,
    @Body()
    dto: CreateDriverTripDto,
  ) {
    this.requireDriver(req);

    return this.driversService.createMyTrip(
      this.getUserId(req),
      dto,
    );
  }


  // ==========================================================
  // WAITING -> BOARDING
  // ==========================================================

  @Patch("trips/:tripId/boarding")
  @ApiOperation({
    summary:
      "Driver starts passenger boarding",
  })
  startBoarding(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDriver(req);

    return this.driversService.startMyTripBoarding(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // BOARDING -> EN_ROUTE
  // ==========================================================

  @Patch("trips/:tripId/start")
  @ApiOperation({
    summary:
      "Driver starts the trip after boarding",
  })
  startTrip(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDriver(req);

    return this.driversService.startMyTrip(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // EN_ROUTE -> APPROACHING
  //
  // Only municipality -> terminal.
  // ==========================================================

  @Patch("trips/:tripId/approaching")
  @ApiOperation({
    summary:
      "Driver marks outbound trip as approaching terminal",
  })
  markApproaching(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDriver(req);

    return this.driversService.markMyTripApproaching(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // RETURN -> NEXT OUTBOUND
  //
  // Driver arrives at municipality.
  // ==========================================================

  @Patch("trips/:tripId/arrived")
  @ApiOperation({
    summary:
      "Driver arrives at municipality and starts next cycle",
  })
  markArrived(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDriver(req);

    return this.driversService.markMyTripArrived(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // AUTH
  // ==========================================================

  private getAuthUser(
    req: Request,
  ): {
    id: string;
    role: UserRole;
  } {
    const user =
      req.user as
        | AuthenticatedUser
        | undefined;


    const userId =
      user?.sub ??
      user?.id;


    if (!userId) {
      throw new UnauthorizedException(
        "Authenticated user ID not found",
      );
    }


    const role =
      String(
        user?.role ??
          "",
      ).toUpperCase();


    if (
      role !==
      UserRole.DRIVER
    ) {
      throw new ForbiddenException(
        "Driver access required",
      );
    }


    return {
      id:
        userId,

      role:
        UserRole.DRIVER,
    };
  }


  private getUserId(
    req: Request,
  ): string {
    return this.getAuthUser(
      req,
    ).id;
  }


  private requireDriver(
    req: Request,
  ): void {
    this.getAuthUser(
      req,
    );
  }
}