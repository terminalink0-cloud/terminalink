import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCooperativeDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}