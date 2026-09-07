import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    MunicipalitiesController,
  ],
  providers: [
    MunicipalitiesService,
  ],
})
export class MunicipalitiesModule {}