import { Module } from '@nestjs/common';
import { SudokuController } from './sudoku.controller';
import { SudokuService } from './sudoku.service';
import { sudokuProviders } from '../../model/sudoku.provider';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SudokuController],
  providers: [
    SudokuService,
    ...sudokuProviders],
})
export class SudokuModule {}
