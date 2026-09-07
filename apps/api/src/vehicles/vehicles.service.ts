import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        ...dto,
        qrToken: randomUUID(),
      },
    });
  }

  findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
    });
  }

  update(id: string, dto: UpdateVehicleDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}