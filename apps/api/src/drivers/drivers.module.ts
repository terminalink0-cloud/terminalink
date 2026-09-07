
// apps/api/src/drivers/drivers.module.ts

import {
  Module,
} from "@nestjs/common";

import {
  DriversController,
} from "./drivers.controller";

import {
  DriverOperationsController,
} from "./driver-operations.controller";

import {
  DriversService,
} from "./drivers.service";

import {
  PrismaService,
} from "../prisma/prisma.service";


@Module({
  controllers: [
    DriversController,
    DriverOperationsController,
  ],

  providers: [
    DriversService,
    PrismaService,
  ],

  exports: [
    DriversService,
  ],
})
export class DriversModule {}
