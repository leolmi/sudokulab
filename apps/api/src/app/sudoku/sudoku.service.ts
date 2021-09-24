import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { Sudoku } from '../../model/sudoku.interface';

@Injectable()
export class SudokuService {

  constructor(@Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<Sudoku>) {}

  async create(sudokuDto: SudokuDto): Promise<Sudoku> {
    const createdSudoku = new this.sudokuModel(sudokuDto);
    return await createdSudoku.save();
  }

  async findAll(): Promise<Sudoku[]> {
    return await this.sudokuModel.find().exec();
  }

  async find(id: string): Promise<Sudoku> {
    return await this.sudokuModel.findById(id).exec();
  }

  async update(id: string, sudokuDto: SudokuDto): Promise<Sudoku> {
    return await this.sudokuModel.findByIdAndUpdate(id, sudokuDto);
  }

  async delete(id: string, sudokuDto: SudokuDto): Promise<Sudoku> {
    return await this.sudokuModel.findByIdAndRemove(id);
  }
}
