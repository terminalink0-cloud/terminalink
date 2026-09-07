import { Test, TestingModule } from '@nestjs/testing';
import { CooperativesController } from './cooperatives.controller';

describe('CooperativesController', () => {
  let controller: CooperativesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CooperativesController],
    }).compile();

    controller = module.get<CooperativesController>(CooperativesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
