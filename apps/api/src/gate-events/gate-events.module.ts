import { Module } from '@nestjs/common';

import { GateEventsController } from './gate-events.controller';
import { GateEventsService } from './gate-events.service';
import { PrismaService } from '../prisma/prisma.service';


@Module({
  controllers: [
    GateEventsController,
  ],
  providers: [
    GateEventsService,
    PrismaService,
  ],
})
export class GateEventsModule {}