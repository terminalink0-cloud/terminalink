import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';

import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {

  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  overview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.overview(from, to);
  }

  @Get('dashboard')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  dashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.dashboard(from, to);
  }

  @Get('trips')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  trips(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.tripReport(from, to);
  }

  @Get('revenue')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  revenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.revenueReport(from, to);
  }

}