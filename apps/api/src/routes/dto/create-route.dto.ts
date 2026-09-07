import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';


export class CreateRouteDto {

  @IsString()
  originId:string;


  @IsString()
  destinationId:string;


  @IsNumber()
  distanceKm:number;


  @IsInt()
  estimatedMinutes:number;


  @IsOptional()
  @IsInt()
  displayOrder?:number;


  @IsOptional()
  @IsBoolean()
  active?:boolean;

}