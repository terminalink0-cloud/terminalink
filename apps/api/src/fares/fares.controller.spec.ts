import { Test, TestingModule } from '@nestjs/testing';
import { FaresController } from './fares.controller';

describe('FaresController', () => {
  let controller: FaresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaresController],
    }).compile();

    controller = module.get<FaresController>(FaresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
