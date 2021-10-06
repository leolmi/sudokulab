import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { validate } from './sudoku.logic';
import { SDK_PREFIX, SDK_PREFIX_W, Sudoku } from '@sudokulab/model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SudokuService implements OnModuleInit {

  constructor(@Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<SudokuDoc>) {}

  async getAll(): Promise<SudokuDoc[]> {
    return await this.sudokuModel.find().exec();
  }

  async check(sudokuDto: SudokuDto): Promise<SudokuDoc|undefined> {
    if (!validate(sudokuDto)) return Promise.resolve(undefined);
    return new Promise<SudokuDoc|undefined>((resolve, reject) => {
      this.sudokuModel
        .updateOne({ _id: sudokuDto._id }, { $setOnInsert: sudokuDto }, { upsert: true })
        .then(resp => {
          resolve(resp.upsertedCount>0 ? <SudokuDoc>sudokuDto : undefined);
        }, err => reject(err));
    })
  }

  onModuleInit(): any {
    console.log(...SDK_PREFIX_W, 'check static schemas...');
    const schemasFolder = path.resolve(__dirname, `./assets/schemas`);
    fs.readdir(schemasFolder, (err, files) => {
      (files||[])
        .forEach(file => {
          const sch_str = fs.readFileSync(`${schemasFolder}/${file}`, {encoding: 'utf8', flag: 'r'});
          try {
            const schema = new Sudoku(JSON.parse(sch_str));
            if (!!schema) {
              this.sudokuModel
                .updateOne({ _id: schema._id }, { $setOnInsert: schema }, { upsert: true })
                .then(resp => resp.upsertedCount>0 ? console.log(...SDK_PREFIX_W, `The schema "${schema._id}" has been successfully added!`) : null);
            }
          } catch (err) {
            console.error('Cannot deserialize schema data!', file);
          }
        });
    });
  }
}
