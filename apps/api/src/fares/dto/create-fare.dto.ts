import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { PaymentMethod } from '@prisma/client';

export class CreateFareDto {

  @IsString()
  tripId: string;

  @IsOptional()
  @IsString()
  boardingId?: string;

  @IsString()
  passengerName: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

}