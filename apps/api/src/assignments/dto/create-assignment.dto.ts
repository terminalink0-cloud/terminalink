import {
  ApiProperty,
} from "@nestjs/swagger";

import {
  IsOptional,
  IsString,
} from "class-validator";


export class CreateAssignmentDto {

  @ApiProperty({
    description:
      "DriverProfile ID",
  })
  @IsString()
  driverId!: string;


  @ApiProperty({
    description:
      "Vehicle ID",
  })
  @IsString()
  vehicleId!: string;


  @ApiProperty({
    required: false,
    description:
      "User ID of the admin creating the assignment",
  })
  @IsOptional()
  @IsString()
  assignedByUserId?: string;


  @ApiProperty({
    required: false,
    description:
      "Optional assignment notes",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}