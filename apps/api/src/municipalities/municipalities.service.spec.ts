import { Test, TestingModule } from '@nestjs/testing';
import { MunicipalitiesService } from './municipalities.service';

describe('MunicipalitiesService', () => {
  let service: MunicipalitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MunicipalitiesService],
    }).compile();

    service = module.get<MunicipalitiesService>(MunicipalitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
