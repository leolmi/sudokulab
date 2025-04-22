import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { join } from 'path';
import fs from 'fs';
import { extendInfo, SDK_PREFIX, Sudoku, SudokuEx } from '@olmi/model';
import { isArray as _isArray } from 'lodash';
import { getAcquireOperations, translate } from './sudoku.logic';
import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { OcrResult } from '../../model/ocr.result';
import { notImplemented } from '../../model/consts';
import { environment } from '../../environments/environment';
import { getSolution, solve } from '@olmi/logic';


export interface AcquireResult {
  data?: any;
  error?: any;
}


@Injectable()
export class SudokuService implements OnModuleInit {

  constructor(@Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<SudokuDoc>) {}

  async getSchemas(): Promise<SudokuDoc[]> {
    return await this.sudokuModel.find().exec();
  }

  async check(sudokuDto: SudokuDto): Promise<SudokuEx|undefined> {
    if (environment.debug) console.log(...SDK_PREFIX, 'check schema request', sudokuDto);
    const sdk = new Sudoku({ values: sudokuDto.values, name: sudokuDto.name });
    try {
      const solved = solve(sdk);
      const sol = getSolution(solved);
      if (sol) {
        extendInfo(sol, sudokuDto);
        const result: any = await this.sudokuModel.updateOne({ _id: sol._id }, { $set: sol }, { upsert: true });
        if (environment.debug) console.log(...SDK_PREFIX, `check results for "${sudokuDto._id}"`, result);
        if (result?.acknowledged) return sol;
      }
    } catch (err) {
      console.error(`error while checking sudoku "${sudokuDto.values}"`, err);
    }
    return undefined;
  }

  onModuleInit(): any {
    // if (environment.debug) console.log(...SDK_PREFIX_W, 'check static schemas...');
    // const schemasFolder = path.resolve(__dirname, `./assets/schemas`);
    // fs.readdir(schemasFolder, (err, files) => {
    //   (files||[])
    //     .forEach(file => {
    //       const sch_str = fs.readFileSync(`${schemasFolder}/${file}`, {encoding: 'utf8', flag: 'r'});
    //       try {
    //         const schema = new Sudoku(JSON.parse(sch_str));
    //         if (!!schema) {
    //           this.sudokuModel
    //             .updateOne({ _id: schema._id }, { $setOnInsert: schema }, { upsert: true })
    //             .then(resp => resp.upsertedCount>0 ? console.log(...SDK_PREFIX_W, `The schema "${schema._id}" has been successfully added!`) : null);
    //         }
    //       } catch (err) {
    //         console.error('Cannot deserialize schema data!', file);
    //       }
    //     });
    // });
  }

  async ocr(img: ImgDto, o?: OcrOptions): Promise<OcrResult> {

    notImplemented();

    // TODO...
    //   return await ocr(img, o);

    return Promise.resolve(new OcrResult());
  }

  async manage(data: any): Promise<any> {  //ManageDto

    notImplemented();

    // if (data.key !== environment.managementKey)
    //   return Promise.reject('Management needs enter the valid key!');
    // const func = manage[data.operation];
    // return func ? func(this.sudokuModel, data.args) : Promise.reject('Unknown operation');
    return Promise.resolve(null);
  }

  /**
   * converte i file di vecchia versione
   * @param path
   */
  async convert(path?: string): Promise<Sudoku[]> {
    const filePath = join(process.cwd(), path || 'documents/schemas.json');
    const json = fs.readFileSync(filePath, 'utf8');
    try {
      const schemas = <any[]>JSON.parse(json);
      if (!_isArray(schemas)) throw new Error('undefined array of schemas');
      return translate(schemas);
    } catch (err) {
      console.error(`error while parsing json file "${filePath}"`, err);
    }
    return [];
  }

  /**
   * Acquisisce un elenco di schemi come stringhe o oggetti Sudoku
   * @param path
   */
  async acquire(path?: string) {
    const result: AcquireResult = {};
    if (!path) {
      result.error = 'undefined path';
    } else {
      const filePath = join(process.cwd(), path);
      // console.log(`reading file "${filePath}"...`);
      const json = fs.readFileSync(filePath, 'utf8');
      try {
        const sudokus = <any[]>JSON.parse(json);
        if (!_isArray(sudokus)) {
          result.error = 'undefined array of schemas';
        } else {
          // console.log(`${sudokus.length} schemas found`);
          const operations = await getAcquireOperations(sudokus);
          // console.log(`running bulk for ${operations.length} operations...`, operations[0]);
          result.data = await this.sudokuModel.bulkWrite(operations);
        }
      } catch (err) {
        result.error = err;
        console.error(`error while parsing json file "${filePath}"`, err);
      }
    }
    return result;
  }

  /**
   * ricalcola tutti gli schemi in catalogo
   */
  async refreshAll() {
    // TODO...

    notImplemented();
  }
}


// const handleSuccess = (handler: (doc: SudokuDoc) => any, sdk: SudokuDto, message?: string) => {
//   if (environment.debug) console.log(...SDK_PREFIX_W, message||'document saved', sdk);
//   handler(<SudokuDoc>sdk);
// };
//
// const handleError = (handler: (e: any) => any, err: any, args?: any) => {
//   console.error(...SDK_PREFIX_W, err, args||'');
//   handler(err);
// };
