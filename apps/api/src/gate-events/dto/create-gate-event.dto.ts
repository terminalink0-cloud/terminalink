import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { GateType } from '@prisma/client';


export class CreateGateEventDto {

  @IsString()
  tripId:string;


  @IsString()
  dispatcherId:string;


  @IsEnum(GateType)
  gateType:GateType;


  @IsOptional()
  @IsString()
  remarks?:string;

}