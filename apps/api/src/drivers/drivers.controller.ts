
// apps/api/src/drivers/drivers.controller.ts

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import type { Request } from "express";

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "@prisma/client";

import {
  DriversService,
} from "./drivers.service";

import {
  CreateDriverDto,
} from "./dto/create-driver.dto";

import {
  UpdateDriverDto,
} from "./dto/update-driver.dto";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


type AuthenticatedRequestUser = {
  sub?: string;
  id?: string;
  role?: UserRole | string;
};


@ApiTags("Drivers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("drivers")
export class DriversController {

  constructor(
    private readonly driversService:
      DriversService,
  ) {}


  // ==========================================================
  // ADMIN MANAGEMENT
  // ==========================================================

  @Post()
  @ApiOperation({
    summary: "Create driver profile",
  })
  create(
    @Body() dto: CreateDriverDto,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.driversService.create(
      dto,
    );
  }


  @Get()
  @ApiOperation({
    summary: "List drivers",
  })
  findAll(
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.driversService.findAll();
  }


  // ==========================================================
  // DRIVER SELF-SERVICE
  // ==========================================================

  @Get("me")
  @ApiOperation({
    summary:
      "Get authenticated driver's profile",
  })
  me(
    @Req() req: Request,
  ) {
    return this.driversService.findMe(
      this.getUserId(req),
    );
  }


  @Get("me/trips")
  @ApiOperation({
    summary:
      "Get authenticated driver's trips",
  })
  myTrips(
    @Req() req: Request,
  ) {
    return this.driversService.findMyTrips(
      this.getUserId(req),
    );
  }


  // ==========================================================
  // SINGLE DRIVER
  // ==========================================================

  @Get(":id")
  @ApiOperation({
    summary:
      "Get driver profile",
  })
  findOne(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const user =
      this.getAuthUser(req);

    if (
      user.role ===
      UserRole.ADMIN
    ) {
      return this.driversService.findOne(
        id,
      );
    }

    return this.driversService.findOwnProfileById(
      id,
      this.getUserId(req),
    );
  }


  @Patch(":id")
  @ApiOperation({
    summary:
      "Update driver profile",
  })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: Request,
  ) {
    const user =
      this.getAuthUser(req);

    if (
      user.role ===
      UserRole.ADMIN
    ) {
      return this.driversService.update(
        id,
        dto,
      );
    }

    return this.driversService.updateOwnProfile(
      id,
      this.getUserId(req),
      dto,
    );
  }


  @Delete(":id")
  @ApiOperation({
    summary:
      "Delete driver profile",
  })
  remove(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);

    return this.driversService.remove(
      id,
    );
  }


  // ==========================================================
  // AUTH HELPERS
  // ==========================================================

  private getAuthUser(
    req: Request,
  ): {
    id: string;
    role: UserRole;
  } {
    const user =
      req.user as
        | AuthenticatedRequestUser
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
      role !== UserRole.ADMIN &&
      role !== UserRole.DRIVER &&
      role !== UserRole.DISPATCHER
    ) {
      throw new ForbiddenException(
        "Unsupported user role",
      );
    }

    return {
      id: userId,
      role:
        role as UserRole,
    };
  }


  private getUserId(
    req: Request,
  ): string {
    return this.getAuthUser(req).id;
  }


  private requireAdmin(
    req: Request,
  ): void {
    const user =
      this.getAuthUser(req);

    if (
      user.role !==
      UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Administrator access required",
      );
    }
  }
}
