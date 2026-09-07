
// apps/api/src/assignments/assignments.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
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
  AssignmentsService,
} from "./assignments.service";

import {
  CreateAssignmentDto,
} from "./dto/create-assignment.dto";

import {
  UpdateAssignmentDto,
} from "./dto/update-assignment.dto";


type AuthUser = {
  sub?: string;
  id?: string;
  role?: string;
};


@ApiTags("Assignments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("assignments")
export class AssignmentsController {
  constructor(
    private readonly assignmentsService:
      AssignmentsService,
  ) {}


  @Post()
  create(
    @Req() req: Request,
    @Body()
    dto: CreateAssignmentDto,
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

    return this.assignmentsService.create({
      ...dto,
      assignedByUserId:
        userId,
    });
  }


  @Get()
  findAll() {
    return this.assignmentsService.findAll();
  }


  @Get(":id")
  findOne(
    @Param("id")
    id: string,
  ) {
    return this.assignmentsService.findOne(
      id,
    );
  }


  @Patch(":id")
  update(
    @Param("id")
    id: string,
    @Body()
    dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(
      id,
      dto,
    );
  }


  @Delete(":id")
  remove(
    @Param("id")
    id: string,
  ) {
    return this.assignmentsService.remove(
      id,
    );
  }
}

