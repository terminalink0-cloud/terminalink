import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';

import { FaresService } from './fares.service';
import { CreateFareDto } from './dto/create-fare.dto';

@ApiTags('Fares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fares')
export class FaresController {

  constructor(
    private readonly faresService: FaresService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateFareDto,
  ) {
    return this.faresService.create(dto);
  }

  @Get()
  findAll() {
    return this.faresService.findAll();
  }

  @Get('trip/:tripId')
  findByTrip(
    @Param('tripId') tripId: string,
  ) {
    return this.faresService.findByTrip(tripId);
  }

}