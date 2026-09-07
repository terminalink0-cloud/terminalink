import { Test, TestingModule } from '@nestjs/testing';
import { FaresService } from './fares.service';

describe('FaresService', () => {
  let service: FaresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaresService],
    }).compile();

    service = module.get<FaresService>(FaresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
