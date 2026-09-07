import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { DriversModule } from './drivers/drivers.module';
import { RoutesModule } from './routes/routes.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TripsModule } from './trips/trips.module';
import { GpsModule } from './gps/gps.module';
import { GateEventsModule } from './gate-events/gate-events.module';
import { BoardingModule } from './boarding/boarding.module';
import { FaresModule } from './fares/fares.module';
import { ReportsModule } from './reports/reports.module';
import { DispatchersModule } from './dispatchers/dispatchers.module';
import {
  TrackingModule,
} from "./tracking/tracking.module";

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '../../.env',
  }),
  PrismaModule,
  AuthModule,
  VehiclesModule,
  CooperativesModule,
  DriversModule,
  RoutesModule,
  MunicipalitiesModule,
  AssignmentsModule,
  TripsModule,
  GpsModule,
  GateEventsModule,
  BoardingModule,
  FaresModule,
  ReportsModule,
  DispatchersModule,
  TrackingModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}