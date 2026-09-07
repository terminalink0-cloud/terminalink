import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';


export class CreateDispatcherDto {


  @IsString()
  username:string;



  @IsString()
  @MinLength(6)
  password:string;



  @IsString()
  firstName:string;



  @IsOptional()
  @IsString()
  middleName?:string;



  @IsString()
  lastName:string;



  @IsOptional()
  @IsEmail()
  email?:string;



  @IsOptional()
  @IsString()
  phone?:string;



  @IsString()
  terminalName:string;


}