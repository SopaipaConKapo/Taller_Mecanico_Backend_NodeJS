import { Test, TestingModule } from '@nestjs/testing';
import { OrdenesTrabajoController } from './ordenes-trabajo.controller';

describe('OrdenesTrabajoController', () => {
  let controller: OrdenesTrabajoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdenesTrabajoController],
    }).compile();

    controller = module.get<OrdenesTrabajoController>(OrdenesTrabajoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
