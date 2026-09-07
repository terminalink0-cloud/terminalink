import { Test, TestingModule } from '@nestjs/testing';
import { MunicipalitiesController } from './municipalities.controller';

describe('MunicipalitiesController', () => {
  let controller: MunicipalitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MunicipalitiesController],
    }).compile();

    controller = module.get<MunicipalitiesController>(MunicipalitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
