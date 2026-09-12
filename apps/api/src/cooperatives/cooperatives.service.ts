// test commit - safe to remove
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';
import { UpdateCooperativeDto } from './dto/update-cooperative.dto';

// Only the id is needed by the frontend (it just uses
// `.length` to show a count), so select minimally instead of
// pulling full driver/vehicle records into every list response.
const fleetCounts = {
  drivers: {
    select: { id: true },
  },
  vehicles: {
    select: { id: true },
  },
} as const;

@Injectable()
export class CooperativesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateCooperativeDto) {
    return this.prisma.cooperative.create({
      data: dto,
      include: fleetCounts,
    });
  }

  findAll() {
    return this.prisma.cooperative.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: fleetCounts,
    });
  }

  findOne(id: string) {
    return this.prisma.cooperative.findUnique({
      where: { id },
      include: fleetCounts,
    });
  }

  update(id: string, dto: UpdateCooperativeDto) {
    return this.prisma.cooperative.update({
      where: { id },
      data: dto,
      include: fleetCounts,
    });
  }

  remove(id: string) {
    return this.prisma.cooperative.delete({
      where: { id },
    });
  }
}
