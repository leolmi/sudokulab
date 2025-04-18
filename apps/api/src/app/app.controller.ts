import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { Sudoku } from '@olmi/model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('info')
  getData() {
    return this.appService.getData();
  }
}
