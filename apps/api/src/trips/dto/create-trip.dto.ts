import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
} from 'class-validator';

export enum TripDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class CreateTripDto {

  @IsString()
  tripNumber: string;


  @IsString()
  driverId: string;


  @IsString()
  vehicleId: string;


  @IsString()
  routeId: string;


  @IsString()
  municipalityId: string;


  @IsEnum(TripDirection)
  direction: TripDirection;


  @IsInt()
  seatCapacity: number;


  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;


  @IsOptional()
  @IsString()
  notes?: string;
}