import {Controller, Get} from '@nestjs/common';
import {AppService} from './app.service';
import {SudokulabInfo} from '@sudokulab/model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('sudokulab')
  getData(): SudokulabInfo {
    return this.appService.getData();
  }
}
