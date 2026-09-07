import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateLocationDto {
  @IsString()
  tripId!: string;

  @IsString()
  tripLegId!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  speed?: number;

  @IsOptional()
  @IsString()
  recordedAt?: string;
}