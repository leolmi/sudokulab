import { Controller, Get } from '@nestjs/common';
import { Message, Schema } from '@sudokulab/api-interfaces';
import { AppService } from './app.service';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }

  @Get('schemas')
  getSchemas(): Schema[] {
    return this.appService.getSchemas();
  }
}
