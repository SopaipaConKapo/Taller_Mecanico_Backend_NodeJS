import { Test, TestingModule } from '@nestjs/testing';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';

describe('OrdenesTrabajoService', () => {
  let service: OrdenesTrabajoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdenesTrabajoService],
    }).compile();

    service = module.get<OrdenesTrabajoService>(OrdenesTrabajoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
