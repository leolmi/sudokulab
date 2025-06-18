import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { join } from 'path';
import fs from 'fs';
import { extendInfo, SDK_PREFIX, Sudoku, SudokuEx } from '@olmi/model';
import { isArray as _isArray, padStart as _padStart } from 'lodash';
import { getAcquireOperations, getSudoku, translate } from './sudoku.logic';
import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { OcrResult } from '../../model/ocr.result';
import { notImplemented } from '../../model/consts';
import { environment } from '../../environments/environment';
import { algorithmsVersion } from '../../../../../package.json'

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
    return await this._check(sudokuDto);
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
    this.checkAll();
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
   * ricalcola tutti gli schemi non aggiornati in catalogo
   */
  async checkAll() {
    if (environment.skipSchemaCheck) {
      console.log('schema check skipped.');
      return;
    }
    const t = performance.now();
    const sdks = await this.sudokuModel.find().exec();
    const tot = sdks.length;
    // const sdk = sdks[0];
    console.log(...SDK_PREFIX, `checking ${tot} schemas start...`);
    if (environment.debug) console.log(`schema version: ${algorithmsVersion}`)
    let index = 0;
    let updated = 0;
    for (const sdk of sdks) {
      index++;
      // se la versione di calcolo è anteriore lo ricalcola
      if (!checkAlgorithmsVersion(sdk.info.version)) {
        if (environment.debug) console.log(`upgrading (${index}/${tot}) schema "${sdk.values}" (${sdk.info.version})...`);
        const res = await this._check(sdk);
        if (res && environment.debug) console.log(`\t> upgraded to version ${res.info.version}`);
        updated++;
      } else {
        if (environment.debug) console.log(`schema (${index}/${tot}) "${sdk._id}" with right version: ${sdk.info.version}`);
      }
    }
    const elapsed = performance.now() - t;
    console.log(...SDK_PREFIX, `checking all schemas done in ${elapsed.toFixed(0)}mls, ${updated} schemas updated.`);
  }

  private async _check(info: Partial<Sudoku>): Promise<SudokuEx|undefined> {
    const sdk = new Sudoku({ values: info.values, name: info.name });
    try {
      const sol = await getSudoku(sdk);
      if (sol) {
        extendInfo(sol, info);
        const result: any = await this.sudokuModel.updateOne({ _id: sol._id }, { $set: sol }, { upsert: true });
        if (environment.debug) console.log(...SDK_PREFIX, `check results for "${info._id}"`, result);
        if (result?.acknowledged) return sol;
      }
    } catch (err) {
      console.error(`error while checking sudoku "${info.values}"`, err);
    }
    return undefined;
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

/**
 * restituisce un numerico confrontabile dalla versione
 * "x.yyy"  =>  x0yyy
 * "xx.y"   => xx000y
 * @param v
 */
const getAlgorithmsVersionNumber = (v?: string): number => {
  if (!/^\d{1,4}\.\d{1,4}$/g.test(`${v||''}`)) return 0;
  const ns = v.split('.').map(vs => _padStart(vs, 4, '0')).join('');
  return parseInt(ns, 10);
}

const checkAlgorithmsVersion = (v: string|undefined): boolean =>
  getAlgorithmsVersionNumber(v) >= getAlgorithmsVersionNumber(algorithmsVersion);
