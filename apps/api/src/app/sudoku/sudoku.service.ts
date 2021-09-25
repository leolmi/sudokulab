import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { Sudoku } from '../../model/sudoku.interface';
import { validate } from './sudoku.logic';

@Injectable()
export class SudokuService {

  constructor(@Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<Sudoku>) {}

  // async create(sudokuDto: SudokuDto): Promise<Sudoku> {
  //   const createdSudoku = new this.sudokuModel(sudokuDto);
  //   return await createdSudoku.save();
  // }

  async getAll(): Promise<Sudoku[]> {
    return await this.sudokuModel.find().exec();
  }

  // async find(id: string): Promise<Sudoku> {
  //   return await this.sudokuModel.findById(id).exec();
  // }
  //
  // async update(id: string, sudokuDto: SudokuDto): Promise<Sudoku> {
  //   return await this.sudokuModel.findByIdAndUpdate(id, sudokuDto);
  // }
  //
  // async delete(id: string, sudokuDto: SudokuDto): Promise<Sudoku> {
  //   return await this.sudokuModel.findByIdAndRemove(id);
  // }

  async check(sudokuDto: SudokuDto): Promise<Sudoku|undefined> {
    if (!validate(sudokuDto)) return Promise.resolve(undefined);
    return new Promise<Sudoku|undefined>((resolve, reject) => {
      this.sudokuModel
        // .updateOne({ _id: sudokuDto._id }, sudokuDto)
        .update({ _id: sudokuDto._id }, { $setOnInsert: sudokuDto }, { upsert: true })
        .then(resp => {
          resolve(resp.upsertedCount>0 ? <Sudoku>sudokuDto : undefined);
        }, err => reject(err));
    })
  }
}
