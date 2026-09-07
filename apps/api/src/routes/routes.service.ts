import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';


@Injectable()
export class RoutesService {

  constructor(
    private prisma: PrismaService,
  ){}


  create(dto:CreateRouteDto){

    return this.prisma.route.create({
      data:dto,

      include:{
        origin:true,
        destination:true,
      },

    });

  }



  findAll(){

    return this.prisma.route.findMany({

      orderBy:{
        createdAt:'desc',
      },

      include:{
        origin:true,
        destination:true,
      },

    });

  }



  findOne(id:string){

    return this.prisma.route.findUnique({

      where:{
        id,
      },

      include:{
        origin:true,
        destination:true,
      },

    });

  }



  update(
    id:string,
    dto:UpdateRouteDto,
  ){

    return this.prisma.route.update({

      where:{
        id,
      },

      data:dto,

    });

  }



  remove(id:string){

    return this.prisma.route.delete({

      where:{
        id,
      },

    });

  }

}