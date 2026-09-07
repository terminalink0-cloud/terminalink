import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';


import { RoutesService } from './routes.service';

import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';


import { JwtAuthGuard } from '../auth/guards/jwt.guard';



@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

@Controller('routes')
export class RoutesController {


  constructor(
    private readonly routesService:RoutesService,
  ){}



  @Post()
  create(
    @Body() dto:CreateRouteDto,
  ){

    return this.routesService.create(dto);

  }



  @Get()
  findAll(){

    return this.routesService.findAll();

  }



  @Get(':id')
  findOne(
    @Param('id') id:string,
  ){

    return this.routesService.findOne(id);

  }



  @Patch(':id')
  update(
    @Param('id') id:string,
    @Body() dto:UpdateRouteDto,
  ){

    return this.routesService.update(
      id,
      dto,
    );

  }



  @Delete(':id')
  remove(
    @Param('id') id:string,
  ){

    return this.routesService.remove(id);

  }


}