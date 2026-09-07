
// apps/api/src/dispatchers/dispatcher-operations.controller.ts

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
  TripStatus,
  UserRole,
} from "@prisma/client";

import {
  DispatchersService,
} from "./dispatchers.service";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


type AuthenticatedUser = {
  sub?: string;
  id?: string;
  role?: UserRole | string;
};


type UpdateTripStatusBody = {
  status?: TripStatus | string;
};


type DepartTripBody = {
  confirmUnfilledSeats?: boolean;
};


type VerifyArrivalBody = {
  token?: string;
};


@ApiTags("Dispatcher Operations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dispatcher")
export class DispatcherOperationsController {
  constructor(
    private readonly service:
      DispatchersService,
  ) {}


  // ==========================================================
  // OPERATIONS DASHBOARD
  // ==========================================================

  @Get("dashboard")
  @ApiOperation({
    summary:
      "Get dispatcher operations dashboard",
  })
  getOperationsDashboard(
    @Req() req: Request,
  ) {
    this.requireDispatcher(
      req,
    );

    return this.service.getOperationsDashboard(
      this.getUserId(req),
    );
  }


  // ==========================================================
  // TRIPS
  // ==========================================================

  @Get("trips")
  @ApiOperation({
    summary:
      "Get dispatcher trips",
  })
  getTrips(
    @Req() req: Request,
  ) {
    this.requireDispatcher(
      req,
    );

    return this.service.getIncomingTrips();
  }


  // ==========================================================
  // INCOMING TRIPS
  // ==========================================================

  @Get("trips/incoming")
  @ApiOperation({
    summary:
      "Get incoming trips at the terminal",
  })
  getIncomingTrips(
    @Req() req: Request,
  ) {
    this.requireDispatcher(
      req,
    );

    return this.service.getIncomingTrips();
  }


  // ==========================================================
  // ONE TRIP
  // ==========================================================

  @Get("trips/:tripId")
  @ApiOperation({
    summary:
      "Get one dispatcher trip",
  })
  getTrip(
    @Req() req: Request,
    @Param("tripId")
    tripId: string,
  ) {
    this.requireDispatcher(
      req,
    );

    return this.service.findTrip(
      tripId,
    );
  }


  // ==========================================================
  // UPDATE TRIP STATUS
  // ==========================================================

  @Patch("trips/:tripId/status")
  @ApiOperation({
    summary:
      "Update dispatcher-visible trip status",
  })
  updateTripStatus(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,

    @Body()
    body: UpdateTripStatusBody,
  ) {
    this.requireDispatcher(
      req,
    );


    const rawStatus =
      String(
        body?.status ??
          "",
      ).toUpperCase();


    if (
      !Object.values(
        TripStatus,
      ).includes(
        rawStatus as TripStatus,
      )
    ) {
      throw new ForbiddenException(
        "Invalid trip status",
      );
    }


    return this.service.updateTripStatus(
      this.getUserId(req),
      tripId,
      rawStatus as TripStatus,
    );
  }


  // ==========================================================
  // MARK ARRIVED / TERMINAL QR VERIFICATION
  // ==========================================================

  @Patch("trips/:tripId/arrived")
  @ApiOperation({
    summary:
      "Verify terminal arrival using trip-leg QR",
  })
  markArrived(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,

    @Body()
    body: VerifyArrivalBody,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.markTripArrived(
      tripId,
      this.getUserId(req),
      body?.token,
    );
  }


  // ==========================================================
  // QR ARRIVAL ALIAS
  // ==========================================================

  @Post("trips/:tripId/verify-arrival")
  @ApiOperation({
    summary:
      "Verify terminal arrival using trip-leg QR",
  })
  verifyArrival(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,

    @Body()
    body: VerifyArrivalBody,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.markTripArrived(
      tripId,
      this.getUserId(req),
      body?.token,
    );
  }


  // ==========================================================
  // START BOARDING
  // ==========================================================

  @Patch("trips/:tripId/boarding")
  @ApiOperation({
    summary:
      "Deprecated dispatcher boarding endpoint",
  })
  startBoarding(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.startBoarding(
      this.getUserId(req),
      tripId,
    );
  }


  // ==========================================================
  // DEPART
  // ==========================================================

  @Patch("trips/:tripId/depart")
  @ApiOperation({
    summary:
      "Deprecated dispatcher departure endpoint",
  })
  depart(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,

    @Body()
    body: DepartTripBody,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.departTrip(
      this.getUserId(req),
      tripId,
      body?.confirmUnfilledSeats ===
        true,
    );
  }


  // ==========================================================
  // COMPLETE RETURN TRIP
  // ==========================================================

  @Patch("trips/:tripId/complete")
  @ApiOperation({
    summary:
      "Complete returned trip",
  })
  complete(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.completeTrip(
      tripId,
      this.getUserId(req),
    );
  }


  // ==========================================================
  // TERMINAL QUEUE POSITION
  // ==========================================================

  @Get("trips/:tripId/queue")
  @ApiOperation({
    summary:
      "Get terminal queue position for a trip",
  })
  getTerminalQueuePosition(
    @Req() req: Request,

    @Param("tripId")
    tripId: string,
  ) {
    this.requireDispatcher(
      req,
    );


    return this.service.getTerminalQueuePosition(
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
      UserRole.DISPATCHER
    ) {
      throw new ForbiddenException(
        "Dispatcher access required",
      );
    }


    return {
      id:
        userId,

      role:
        UserRole.DISPATCHER,
    };
  }


  private getUserId(
    req: Request,
  ): string {
    return this.getAuthUser(
      req,
    ).id;
  }


  private requireDispatcher(
    req: Request,
  ): void {
    this.getAuthUser(
      req,
    );
  }
}
