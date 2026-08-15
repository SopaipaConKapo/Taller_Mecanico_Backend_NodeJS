import { Test, TestingModule } from '@nestjs/testing';
import { RepuestosController } from './repuestos.controller';

describe('RepuestosController', () => {
  let controller: RepuestosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepuestosController],
    }).compile();

    controller = module.get<RepuestosController>(RepuestosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
