import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateFareDto } from './dto/create-fare.dto';

@Injectable()
export class FaresService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateFareDto) {

    const trip = await this.prisma.trip.findUnique({
      where: {
        id: dto.tripId,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (dto.boardingId) {

      const boarding =
        await this.prisma.boarding.findUnique({
          where: {
            id: dto.boardingId,
          },
          include: {
            fare: true,
          },
        });

      if (!boarding) {
        throw new NotFoundException(
          'Boarding record not found',
        );
      }

      if (boarding.fare) {
        throw new BadRequestException(
          'Fare already collected',
        );
      }
    }

    return this.prisma.fare.create({
      data: {
        tripId: dto.tripId,
        boardingId: dto.boardingId,
        passengerName: dto.passengerName,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
      },
      include: {
        trip: true,
        boarding: true,
      },
    });
  }

  findAll() {
    return this.prisma.fare.findMany({
      orderBy: {
        paidAt: 'desc',
      },
      include: {
        trip: true,
        boarding: true,
      },
    });
  }

  findByTrip(tripId: string) {
    return this.prisma.fare.findMany({
      where: {
        tripId,
      },
      orderBy: {
        paidAt: 'asc',
      },
      include: {
        boarding: true,
      },
    });
  }
}