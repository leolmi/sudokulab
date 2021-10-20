import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { ImgDto, ManageDto, OcrResult } from '@sudokulab/model';
import { AuthGuard } from '@nestjs/passport';
import { environment } from '../../environments/environment';
import { DevelopGuard } from '../app.develop.guard';

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

  @Post('ocr')
  async ocr(@Body() img: ImgDto): Promise<OcrResult> {
    return await this.sudokuService.ocr(img);
  }

  @Post('manage')
  @UseGuards(AuthGuard('google'))
  async manage(@Body() data: ManageDto) {
    return this.sudokuService.manage(data);
  }

  @Post('managedev')
  @UseGuards(new DevelopGuard())
  async managedev(@Body() data: ManageDto) {
    return this.sudokuService.manage(data);
  }
}
