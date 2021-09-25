import { Body, Controller, Get, Post } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { SudokuDto } from '../../model/sudoku.dto';
import { Sudoku } from '../../model/sudoku.interface';

@Controller('sudoku')
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  // @Post()
  // async create(@Body() sudokuDto: SudokuDto) {
  //   return this.sudokuService.create(sudokuDto);
  // }

  @Get('list')
  async getAll(): Promise<Sudoku[]> {
    return this.sudokuService.getAll();
  }

  // @Get(':id')
  // async find(@Param('id') id: string) {
  //   return this.sudokuService.find(id);
  // }
  //
  // @Put(':id')
  // async update(@Param('id') id: string, @Body() sudokuDto: SudokuDto) {
  //   return this.sudokuService.update(id, sudokuDto);
  // }
  //
  // @Delete(':id')
  // async delete(@Param('id') id: string, @Body() sudokuDto: SudokuDto) {
  //   return this.sudokuService.delete(id, sudokuDto);
  // }

  @Post('check')
  async check(@Body() sudokuDto: SudokuDto) {
    return this.sudokuService.check(sudokuDto);
  }
}
