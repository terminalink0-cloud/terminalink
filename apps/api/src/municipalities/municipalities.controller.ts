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


import { MunicipalitiesService } from './municipalities.service';

import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';


@ApiTags('Municipalities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

@Controller('municipalities')
export class MunicipalitiesController {

  constructor(
    private readonly municipalitiesService: MunicipalitiesService,
  ){}


  @Post()
  create(
    @Body() dto:CreateMunicipalityDto,
  ){
    return this.municipalitiesService.create(dto);
  }


  @Get()
  findAll(){
    return this.municipalitiesService.findAll();
  }


  @Get(':id')
  findOne(
    @Param('id') id:string,
  ){
    return this.municipalitiesService.findOne(id);
  }


  @Patch(':id')
  update(
    @Param('id') id:string,
    @Body() dto:UpdateMunicipalityDto,
  ){
    return this.municipalitiesService.update(id,dto);
  }


  @Delete(':id')
  remove(
    @Param('id') id:string,
  ){
    return this.municipalitiesService.remove(id);
  }

}