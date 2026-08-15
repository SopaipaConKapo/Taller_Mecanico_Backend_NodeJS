import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopServiceController } from './workshop-service.controller';
import { WorkshopServiceService } from './workshop-service.service';

describe('WorkshopServiceController', () => {
  let workshopServiceController: WorkshopServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopServiceController],
      providers: [WorkshopServiceService],
    }).compile();

    workshopServiceController = app.get<WorkshopServiceController>(WorkshopServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(workshopServiceController.getHello()).toBe('Hello World!');
    });
  });
});
