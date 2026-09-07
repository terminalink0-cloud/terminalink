import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  cooperativeId: string;

  @IsString()
  plateNumber: string;

  @IsOptional()
  @IsString()
  bodyNumber?: string;

  @IsInt()
  seatCapacity: number;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  yearModel?: number;

  @IsOptional()
  @IsString()
  color?: string;
}