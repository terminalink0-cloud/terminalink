import {
  PartialType,
} from "@nestjs/swagger";

import {
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";

import {
  AssignmentStatus,
} from "@prisma/client";

import {
  CreateAssignmentDto,
} from "./create-assignment.dto";


export class UpdateAssignmentDto
  extends PartialType(
    CreateAssignmentDto,
  ) {

  @IsOptional()
  @IsEnum(
    AssignmentStatus,
  )
  status?: AssignmentStatus;


  @IsOptional()
  @IsString()
  notes?: string;
}