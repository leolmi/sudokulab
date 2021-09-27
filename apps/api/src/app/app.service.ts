import { Injectable, OnModuleInit } from '@nestjs/common';
import { Sudoku, SudokulabInfo } from '@sudokulab/model';

@Injectable()
export class AppService {
  getData(): SudokulabInfo {
    return new SudokulabInfo({
      version: '1.0.0'
    });
  }
}
