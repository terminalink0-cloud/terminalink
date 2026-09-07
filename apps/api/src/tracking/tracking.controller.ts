import {
  Body,
  Controller,
  Get,
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
  ApiTags,
} from "@nestjs/swagger";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";

import {
  TrackingGateway,
} from "./tracking.gateway";

import {
  TrackingService,
} from "./tracking.service";

import {
  UpdateLocationDto,
} from "./dto/update-location.dto";


type AuthUser = {
  sub?: string;
  id?: string;
};


@ApiTags("Tracking")
@Controller("tracking")
export class TrackingController {
  constructor(
    private readonly service:
      TrackingService,

    private readonly gateway:
      TrackingGateway,
  ) {}


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("location")
  async updateLocation(
    @Req() req: Request,
    @Body()
    dto: UpdateLocationDto,
  ) {
    const user =
      req.user as
        | AuthUser
        | undefined;


    const userId =
      user?.sub ??
      user?.id;


    if (!userId) {
      throw new UnauthorizedException(
        "Authenticated user ID not found",
      );
    }


    const vehicle =
      await this.service.updateDriverLocation(
        userId,
        dto,
      );


    this.gateway.broadcastVehicle(
      vehicle,
    );


    return vehicle;
  }


  @Get("live")
  getLiveVehicles() {
    return this.service.getLiveVehicles();
  }
}