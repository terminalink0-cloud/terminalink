import { Test, TestingModule } from '@nestjs/testing';
import { GateEventsService } from './gate-events.service';

describe('GateEventsService', () => {
  let service: GateEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GateEventsService],
    }).compile();

    service = module.get<GateEventsService>(GateEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
