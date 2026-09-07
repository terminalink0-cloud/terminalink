import { IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;
}