import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {

  constructor(
    private prisma: PrismaService,
  ) {}

  private buildDateFilter(
    from?: string,
    to?: string,
  ) {

    if (!from && !to) {
      return undefined;
    }

    return {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to + 'T23:59:59.999Z') : undefined,
    };

  }

  async overview(
    from?: string,
    to?: string,
  ) {

    const [
      dashboard,
      trips,
    ] = await Promise.all([

      this.dashboard(from, to),

      this.tripReport(from, to),

    ]);

    return {

      summary: {
        totalTrips: dashboard.totalTrips,
        completedTrips: dashboard.completedTrips,
        passengers: dashboard.totalPassengers,
        revenue: dashboard.totalRevenue,
      },

      trips,

    };

  }

  async dashboard(
    from?: string,
    to?: string,
  ) {

    const tripDate = this.buildDateFilter(from, to);
    const fareDate = this.buildDateFilter(from, to);

    const [
      totalTrips,
      completedTrips,
      totalPassengers,
      totalRevenue,
    ] = await Promise.all([

      this.prisma.trip.count({
        where: {
          createdAt: tripDate,
        },
      }),

      this.prisma.trip.count({
        where: {
          status: 'COMPLETED',
          createdAt: tripDate,
        },
      }),

      this.prisma.boarding.count({
        where: {
          trip: {
            createdAt: tripDate,
          },
        },
      }),

      this.prisma.fare.aggregate({
        where: {
          paidAt: fareDate,
        },
        _sum: {
          amount: true,
        },
      }),

    ]);

    return {
      totalTrips,
      completedTrips,
      totalPassengers,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };

  }

  tripReport(
    from?: string,
    to?: string,
  ) {

    return this.prisma.trip.findMany({

      where: {
        createdAt: this.buildDateFilter(from, to),
      },

      include: {
        driver: {
          include: {
            user: {
  select: {
    id: true,
    username: true,
    role: true,
    status: true,
    firstName: true,
    middleName: true,
    lastName: true,
    displayName: true,
    phone: true,
    email: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  },
},
          },
        },

        vehicle: true,
        route: true,
        boardings: true,
        gateEvents: true,
      },

      orderBy: {
        createdAt: 'desc',
      },

    });

  }

  revenueReport(
    from?: string,
    to?: string,
  ) {

    return this.prisma.fare.findMany({

      where: {
        paidAt: this.buildDateFilter(from, to),
      },

      include: {
        trip: true,
        boarding: true,
      },

      orderBy: {
        paidAt: 'desc',
      },

    });

  }

}
