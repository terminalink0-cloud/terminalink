
// apps/api/src/trips/trips.controller.ts

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import type { Request } from "express";

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import {
  UserRole,
} from "@prisma/client";

import {
  TripsService,
} from "./trips.service";

import {
  CreateTripDto,
} from "./dto/create-trip.dto";

import {
  UpdateTripDto,
} from "./dto/update-trip.dto";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


type AuthenticatedUser = {
  sub?: string;
  id?: string;
  role?: UserRole | string;
};


@ApiTags("Trips")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("trips")
export class TripsController {
  constructor(
    private readonly tripsService:
      TripsService,
  ) {}


  // ==========================================================
  // ADMIN TRIP MANAGEMENT
  // ==========================================================

  @Post()
  @ApiOperation({
    summary: "Create trip",
  })
  create(
    @Body() dto: CreateTripDto,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.tripsService.create(
      dto,
    );
  }


  @Get()
  @ApiOperation({
    summary: "List all trips",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
  })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Req() req?: Request,
  ) {
    if (!req) {
      throw new UnauthorizedException(
        "Authenticated request required",
      );
    }

    this.requireAdmin(req);

    return this.tripsService.findAll({
      page,
      limit,
      search,
      status,
    });
  }


  @Get(":id")
  @ApiOperation({
    summary: "Get trip by ID",
  })
  findOne(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.tripsService.findOne(
      id,
    );
  }


  @Patch(":id")
  @ApiOperation({
    summary: "Update trip",
  })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTripDto,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.tripsService.update(
      id,
      dto,
    );
  }


  @Post(":id/complete")
  @ApiOperation({
    summary: "Complete trip",
  })
  complete(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.tripsService.completeTrip(
      id,
    );
  }


  @Delete(":id")
  @ApiOperation({
    summary: "Delete trip",
  })
  remove(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.tripsService.remove(
      id,
    );
  }


  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

  private requireAdmin(
    req: Request,
  ): void {
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
        user?.role ?? "",
      ).toUpperCase();

    if (
      role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Administrator access required",
      );
    }
  }
}
