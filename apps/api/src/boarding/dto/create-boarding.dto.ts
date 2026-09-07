import {
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';


export class CreateBoardingDto {

  @IsString()
  tripId:string;


  @IsString()
  passengerName:string;


  @IsOptional()
  @IsInt()
  seatNumber?:number;

}