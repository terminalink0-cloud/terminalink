import { Test, TestingModule } from '@nestjs/testing';
import { DispatchersController } from './dispatchers.controller';

describe('DispatchersController', () => {
  let controller: DispatchersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchersController],
    }).compile();

    controller = module.get<DispatchersController>(DispatchersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
