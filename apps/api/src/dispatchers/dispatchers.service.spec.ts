import { Test, TestingModule } from '@nestjs/testing';
import { DispatchersService } from './dispatchers.service';

describe('DispatchersService', () => {
  let service: DispatchersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DispatchersService],
    }).compile();

    service = module.get<DispatchersService>(DispatchersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
