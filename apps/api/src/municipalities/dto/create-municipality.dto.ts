import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMunicipalityDto {

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  mapZoom?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}