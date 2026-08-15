import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkshopServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
