import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";


export class CreateDriverDto {
  // ==========================================================
  // USER ACCOUNT
  // ==========================================================

  @IsString()
  @MinLength(3)
  username: string;


  @IsString()
  @MinLength(6)
  password: string;


  @IsString()
  firstName: string;


  @IsString()
  lastName: string;


  @IsOptional()
  @IsEmail()
  email?: string;


  @IsOptional()
  @IsString()
  phone?: string;


  // ==========================================================
  // DRIVER PROFILE
  // ==========================================================

  @IsString()
  cooperativeId: string;


  @IsString()
  licenseNumber: string;


  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;


  @IsOptional()
  @IsString()
  emergencyContact?: string;


  @IsOptional()
  @IsString()
  emergencyPhone?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}