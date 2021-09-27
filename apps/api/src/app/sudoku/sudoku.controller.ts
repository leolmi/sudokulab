import { Body, Controller, Get, Post } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';

@Controller('sudoku')
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  @Get('list')
  async getAll(): Promise<SudokuDoc[]> {
    return this.sudokuService.getAll();
  }

  @Post('check')
  async check(@Body() sudokuDto: SudokuDto) {
    return this.sudokuService.check(sudokuDto);
  }
}
