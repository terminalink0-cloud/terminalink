import {
  PartialType,
} from '@nestjs/swagger';

import {
  IsBoolean,
  IsOptional,
} from 'class-validator';

import {
  CreateDispatcherDto,
} from './create-dispatcher.dto';


export class UpdateDispatcherDto
extends PartialType(
  CreateDispatcherDto
){
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}