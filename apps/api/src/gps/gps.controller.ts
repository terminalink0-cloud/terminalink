
// apps/api/src/gps/gps.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import {
  GpsService,
} from "./gps.service";

import {
  CreateGpsDto,
} from "./dto/create-gps.dto";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


@ApiTags("GPS")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("gps")
export class GpsController {

  constructor(
    private readonly service:
      GpsService,
  ) {}


  // ==========================================================
  // RECORD GPS
  // ==========================================================

  @Post()
  @ApiOperation({
    summary:
      "Record GPS position for a trip leg",
  })
  create(
    @Body()
    dto: CreateGpsDto,
  ) {
    return this.service.create(
      dto,
    );
  }


  // ==========================================================
  // TRIP HISTORY
  // ==========================================================

  @Get("trip/:tripId")
  @ApiOperation({
    summary:
      "Get GPS history for a trip",
  })
  findTripHistory(
    @Param("tripId")
    tripId: string,
  ) {
    return this.service.findTripHistory(
      tripId,
    );
  }


  // ==========================================================
  // LEG HISTORY
  // ==========================================================

  @Get("leg/:tripLegId")
  @ApiOperation({
    summary:
      "Get GPS history for a trip leg",
  })
  findLegHistory(
    @Param("tripLegId")
    tripLegId: string,
  ) {
    return this.service.findLegHistory(
      tripLegId,
    );
  }


  // ==========================================================
  // LATEST LEG POSITION
  // ==========================================================

  @Get("leg/:tripLegId/latest")
  @ApiOperation({
    summary:
      "Get latest GPS position for a trip leg",
  })
  findLatestLegPosition(
    @Param("tripLegId")
    tripLegId: string,
  ) {
    return this.service.findLatestLegPosition(
      tripLegId,
    );
  }


  // ==========================================================
  // LIVE VEHICLE STATE
  // ==========================================================

  @Get("vehicle/:vehicleId")
  @ApiOperation({
    summary:
      "Get current live vehicle location",
  })
  findVehicleState(
    @Param("vehicleId")
    vehicleId: string,
  ) {
    return this.service.findVehicleState(
      vehicleId,
    );
  }
}
