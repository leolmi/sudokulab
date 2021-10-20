import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { SudokulabInfo } from '@sudokulab/model';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('sudokulab')
  getData(): SudokulabInfo {
    return this.appService.getData();
  }
}
