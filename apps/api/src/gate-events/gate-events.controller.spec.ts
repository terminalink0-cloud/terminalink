import { Test, TestingModule } from '@nestjs/testing';
import { GateEventsController } from './gate-events.controller';

describe('GateEventsController', () => {
  let controller: GateEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GateEventsController],
    }).compile();

    controller = module.get<GateEventsController>(GateEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
