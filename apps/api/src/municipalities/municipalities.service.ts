import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';


@Injectable()
export class MunicipalitiesService {

  constructor(
    private prisma: PrismaService,
  ) {}


  create(dto: CreateMunicipalityDto) {
    return this.prisma.municipality.create({
      data: dto,
    });
  }


  findAll() {
    return this.prisma.municipality.findMany({
      orderBy:{
        createdAt:'desc',
      },
    });
  }


  findOne(id:string) {
    return this.prisma.municipality.findUnique({
      where:{
        id,
      },
    });
  }


  update(
    id:string,
    dto:UpdateMunicipalityDto,
  ) {
    return this.prisma.municipality.update({
      where:{
        id,
      },
      data:dto,
    });
  }


  remove(id:string) {
    return this.prisma.municipality.delete({
      where:{
        id,
      },
    });
  }

}