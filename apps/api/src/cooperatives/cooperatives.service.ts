import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';
import { UpdateCooperativeDto } from './dto/update-cooperative.dto';

@Injectable()
export class CooperativesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateCooperativeDto) {
    return this.prisma.cooperative.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.cooperative.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.cooperative.findUnique({
      where: { id },
    });
  }

  update(id: string, dto: UpdateCooperativeDto) {
    return this.prisma.cooperative.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.cooperative.delete({
      where: { id },
    });
  }
}