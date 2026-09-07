
// apps/api/src/gps/dto/create-gps.dto.ts

import {
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";


export class CreateGpsDto {

  @IsString()
  tripId: string;


  @IsString()
  tripLegId: string;


  @IsString()
  vehicleId: string;


  @IsNumber()
  latitude: number;


  @IsNumber()
  longitude: number;


  @IsOptional()
  @IsNumber()
  speedKph?: number;


  @IsOptional()
  @IsNumber()
  heading?: number;


  @IsOptional()
  @IsNumber()
  accuracy?: number;
}
