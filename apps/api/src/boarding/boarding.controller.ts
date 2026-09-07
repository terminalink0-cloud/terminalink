
// apps/api/src/boarding/boarding.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
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
  BoardingService,
} from "./boarding.service";

import {
  CreateBoardingDto,
} from "./dto/create-boarding.dto";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt.guard";


@ApiTags("Boarding")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("boarding")
export class BoardingController {

  constructor(
    private readonly service:
      BoardingService,
  ) {}


  // ==========================================================
  // BOARD PASSENGER
  // ==========================================================

  @Post()
  @ApiOperation({
    summary:
      "Board one passenger on the active trip leg",
  })
  create(
    @Req() req: Request,
    @Body()
    dto: CreateBoardingDto,
  ) {
    return this.service.create(
      dto,
      this.getUserId(req),
    );
  }


  // ==========================================================
  // CURRENT BOARDING PASSENGERS
  // ==========================================================

  @Get("trip/:id")
  @ApiOperation({
    summary:
      "List passengers for the active boarding leg",
  })
  findTrip(
    @Param("id")
    id: string,
  ) {
    return this.service.findTripBoardings(
      id,
    );
  }


  // ==========================================================
  // SPECIFIC LEG
  // ==========================================================

  @Get("leg/:id")
  @ApiOperation({
    summary:
      "List passengers for a specific trip leg",
  })
  findLeg(
    @Param("id")
    id: string,
  ) {
    return this.service.findLegBoardings(
      id,
    );
  }


  // ==========================================================
  // SUMMARY
  // ==========================================================

  @Get("trip/:id/summary")
  @ApiOperation({
    summary:
      "Get active trip-leg boarding summary",
  })
  summary(
    @Param("id")
    id: string,
  ) {
    return this.service.getTripBoardingSummary(
      id,
    );
  }


  // ==========================================================
  // AUTH
  // ==========================================================

  private getUserId(
    req: Request,
  ): string {

    const user =
      req.user as
        | {
            sub?: string;
            id?: string;
          }
        | undefined;


    const userId =
      user?.sub ??
      user?.id;


    if (!userId) {
      throw new UnauthorizedException(
        "Authenticated user ID not found",
      );
    }


    return userId;
  }
}
