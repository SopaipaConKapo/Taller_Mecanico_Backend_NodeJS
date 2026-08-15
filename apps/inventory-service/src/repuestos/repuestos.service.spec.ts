import { Test, TestingModule } from '@nestjs/testing';
import { RepuestosService } from './repuestos.service';

describe('RepuestosService', () => {
  let service: RepuestosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepuestosService],
    }).compile();

    service = module.get<RepuestosService>(RepuestosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
