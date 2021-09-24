import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SudokuModule } from './sudoku/sudoku.module';

@Module({
  imports: [SudokuModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
