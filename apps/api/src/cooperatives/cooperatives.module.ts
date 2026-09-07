import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { CooperativesController } from './cooperatives.controller';
import { CooperativesService } from './cooperatives.service';

@Module({
  imports: [PrismaModule],
  controllers: [CooperativesController],
  providers: [CooperativesService],
})
export class CooperativesModule {}