import { Module } from '@nestjs/common';

import { DispatchersController } from './dispatchers.controller';
import { DispatcherOperationsController } from './dispatcher-operations.controller';
import { DispatchersService } from './dispatchers.service';

import { PrismaService } from '../prisma/prisma.service';


@Module({

  controllers: [
    DispatchersController,
    DispatcherOperationsController,
  ],

  providers: [
    DispatchersService,
    PrismaService,
  ],

  exports: [
    DispatchersService,
  ],

})
export class DispatchersModule {}