import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { validate } from './sudoku.logic';
import {ImgDto, ManageDto, OcrOptions, OcrResult, SDK_PREFIX, SDK_PREFIX_W, Sudoku} from '@sudokulab/model';
import * as fs from 'fs';
import * as path from 'path';
import { ocr } from '../ocr/ocr';
import { manage } from './sudoku.management';
import {environment} from "../../environments/environment";

@Injectable()
export class SudokuService implements OnModuleInit {

  constructor(@Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<SudokuDoc>) {}

  async getAll(): Promise<SudokuDoc[]> {
    return await this.sudokuModel.find().exec();
  }

  async check(sudokuDto: SudokuDto): Promise<SudokuDoc|undefined> {
    if (environment.debug) console.log(...SDK_PREFIX_W, 'check schema', sudokuDto);
    const validation_error = validate(sudokuDto);
    if (!!validation_error) {
      console.error(...SDK_PREFIX, validation_error, sudokuDto);
      return Promise.resolve(undefined);
    }
    return new Promise<SudokuDoc|undefined>((resolve, reject) => {
      this.sudokuModel
        .updateOne({ _id: sudokuDto._id }, { $setOnInsert: sudokuDto }, { upsert: true })
        .then(resp => {
          if (environment.debug) console.log(...SDK_PREFIX_W, 'uploaded schema result:', resp, '\n\rfor schema:', sudokuDto.fixed);
          resolve(resp.upsertedCount>0 ? <SudokuDoc>sudokuDto : undefined);
        }, err => {
          if (environment.debug) console.error(...SDK_PREFIX_W, 'uploaded schema error', err);
          reject(err);
        });
    });
  }

  onModuleInit(): any {
    if (environment.debug) console.log(...SDK_PREFIX_W, 'check static schemas...');
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

  async ocr(img: ImgDto, o?: OcrOptions): Promise<OcrResult> {
    return await ocr(img, o);
  }

  async manage(data: ManageDto): Promise<any> {
    if (data.key !== environment.managementKey)
      return Promise.reject('Management needs enter the valid key!');
    const func = manage[data.operation];
    return func ? func(this.sudokuModel, data.args) : Promise.reject('Unknown operation');
  }
}
