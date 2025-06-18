import { Body, Controller, Get, Post } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { Sudoku, SudokuEx } from '@olmi/model';
import { PathDto } from '../../model/path.dto';
import { badRequest } from '../../model/consts';


/**
 * GESTIONE DEGLI SCHEMI
 *
 *  - get    /sudoku/list
 *  - post   /sudoku/convert    { path }
 *  - post   /sudoku/check      Sudoku
 *  - post   /sudoku/upload     { path }
 *  - post   /sudoku/ocr        { data }
 *  - post   /sudoku/refresh
 */
@Controller('sudoku')
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  /**
   * enumera tutti gli schemi presenti
   */
  @Get('list')
  async getSchemas(): Promise<SudokuDoc[]> {
    return this.sudokuService.getSchemas();
  }

  /**
   * converte cli schemi nel file passato all'ultima versione
   * @param args
   */
  @Post('convert')
  convert(@Body() args: PathDto): Promise<Sudoku[]> {
    if (!args.path) badRequest('undefined path');
    return this.sudokuService.convert(args.path);
  }

  /**
   * verifica lo schema passato aggiornandolo
   * @param sudokuDto
   */
  @Post('check')
  async check(@Body() sudokuDto: SudokuDto): Promise<SudokuEx|undefined> {
    if (!sudokuDto.values) badRequest('undefined schema data');
    return this.sudokuService.check(sudokuDto);
  }

  /**
   * aggiunge tutti gli schemi che trova nel file specificato
   * @param args
   */
  @Post('upload')
  async upload(@Body() args: PathDto): Promise<any> {
    if (!args.path) badRequest('undefined path');
    const result = await this.sudokuService.acquire(args.path);
    if (result.error) badRequest(result.error);
    return result.data;
  }

  /**
   * verifica la versione di tutti gli schemi in catalogo
   */
  @Post('check-all')
  async checkAll(): Promise<any> {
    return this.sudokuService.checkAll();
  }
}
