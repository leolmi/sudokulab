import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { SudokuDto } from '../../model/sudoku.dto';
import { SudokuDoc } from '../../model/sudoku.interface';
import { join } from 'path';
import fs from 'fs';
import { extendInfo, SDK_PREFIX, Sudoku, SudokuEx } from '@olmi/model';
import { isArray as _isArray, padStart as _padStart } from 'lodash';
import { getAcquireOperations, getCatalogVerdict, getSudoku, translate } from './sudoku.logic';
import { countSolutions } from './sudoku.brute-force';
import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { OcrResult } from '../../model/ocr.result';
import { notImplemented } from '../../model/consts';
import { environment } from '../../environments/environment';
import { algorithmsVersion } from '../../../../../package.json'
import { AppStateService } from '../status/app-state.service';
import { CATALOG_STATE_SINGLETON_ID, CatalogStateDoc } from '../../model/catalog-state.schema';

export interface AcquireResult {
  data?: any;
  error?: any;
}

type CheckErrorCode = 'not-unique' | 'invalid' | 'disagreement' | 'engine-error' | 'persist-error';

export interface CheckOutcome {
  sol?: SudokuEx;
  error?: {
    code: CheckErrorCode;
    message: string;
    solutionCount?: number;
  };
}


@Injectable()
export class SudokuService implements OnModuleInit {

  constructor(
    @Inject('SUDOKU_MODEL') private readonly sudokuModel: Model<SudokuDoc>,
    @Inject('CATALOG_STATE_MODEL') private readonly catalogStateModel: Model<CatalogStateDoc>,
    private readonly appState: AppStateService
  ) {}

  async getSchemas(): Promise<SudokuDoc[]> {
    return await this.sudokuModel.find().exec();
  }

  async check(sudokuDto: SudokuDto): Promise<SudokuEx> {
    if (environment.debug) console.log(...SDK_PREFIX, 'check schema request', sudokuDto);
    const out = await this._check(sudokuDto);
    if (out.sol) return out.sol;
    const err = out.error!;
    const status = err.code === 'not-unique' || err.code === 'invalid'
      ? HttpStatus.UNPROCESSABLE_ENTITY
      : HttpStatus.INTERNAL_SERVER_ERROR;
    throw new HttpException({
      code: err.code,
      message: err.message,
      ...(err.solutionCount !== undefined ? { solutionCount: err.solutionCount } : {})
    }, status);
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
   * ricalcola tutti gli schemi non aggiornati in catalogo.
   * Se il catalogo è già certificato per la `algorithmsVersion` corrente
   * (stessa versione + stesso numero di schemi dell'ultima corsa andata a buon fine)
   * il check viene saltato per evitare il costo di un'iterazione inutile.
   */
  async checkAll(options?: { force?: boolean }) {
    if (environment.skipSchemaCheck) {
      console.log('schema check skipped.');
      return;
    }
    if (!options?.force) {
      const cached = await this._isCatalogAlreadyChecked();
      if (cached) {
        console.log(...SDK_PREFIX, `catalog già certificato per versione ${algorithmsVersion} (ultimo check: ${new Date(cached.lastCheckAt).toISOString()}, ${cached.lastSchemaCount} schemi). Skip.`);
        return;
      }
    }
    return this.appState.withBusy('checkAll', () => this._runCheckAll());
  }

  /**
   * Vero se l'ultimo `checkAll` salvato è relativo alla `algorithmsVersion` corrente
   * e il numero di schemi non è cambiato.
   */
  private async _isCatalogAlreadyChecked(): Promise<CatalogStateDoc | null> {
    try {
      const state = await this.catalogStateModel.findById(CATALOG_STATE_SINGLETON_ID).exec();
      if (!state) return null;
      if (state.lastCheckVersion !== algorithmsVersion) return null;
      const currentCount = await this.sudokuModel.countDocuments().exec();
      if (state.lastSchemaCount !== currentCount) {
        console.log(...SDK_PREFIX, `catalog schema count changed (was ${state.lastSchemaCount}, now ${currentCount}), invalidating cached check.`);
        return null;
      }
      return state;
    } catch (err: any) {
      console.warn(...SDK_PREFIX, `cannot read catalog state, will re-run check:`, err?.message || err);
      return null;
    }
  }

  /**
   * Invalida la cache del check (forza il re-check al prossimo avvio).
   */
  async invalidateCheckState(): Promise<void> {
    await this.catalogStateModel.deleteOne({ _id: CATALOG_STATE_SINGLETON_ID }).exec();
    console.log(...SDK_PREFIX, `catalog check state invalidated.`);
  }

  private async _persistCheckState(stats: { tot: number; updated: number; skipped: number; failed: number; deleted: number; elapsedMs: number }): Promise<void> {
    try {
      const currentCount = await this.sudokuModel.countDocuments().exec();
      await this.catalogStateModel.updateOne(
        { _id: CATALOG_STATE_SINGLETON_ID },
        {
          $set: {
            _id: CATALOG_STATE_SINGLETON_ID,
            lastCheckVersion: algorithmsVersion,
            lastCheckAt: Date.now(),
            lastSchemaCount: currentCount,
            lastCheckStats: stats,
          }
        },
        { upsert: true }
      ).exec();
    } catch (err: any) {
      console.warn(...SDK_PREFIX, `cannot persist catalog state:`, err?.message || err);
    }
  }

  private async _runCheckAll() {
    const t = performance.now();
    const sdks = await this.sudokuModel.find().exec();
    const tot = sdks.length;
    console.log(...SDK_PREFIX, `checking ${tot} schemas start...`);
    if (environment.debug) console.log(`schema version: ${algorithmsVersion}`)
    let index = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let deleted = 0;
    const step = Math.max(1, Math.floor(tot / 10));
    let nextMilestone = step;
    for (const sdk of sdks) {
      index++;
      this.appState.setProgress((index / tot) * 100);
      // se la versione di calcolo è anteriore lo ricalcola
      if (!checkAlgorithmsVersion(sdk.info.version)) {
        if (environment.debug) console.log(`upgrading (${index}/${tot}) schema "${sdk.values}" (${sdk.info.version})...`);
        const res = await this._check(sdk);
        if (res.sol) {
          if (environment.debug) console.log(`\t> upgraded to version ${res.sol.info.version}`);
          updated++;
        } else {
          failed++;
          // se il brute-force ha confermato che lo schema non è a soluzione unica
          // (o è incoerente) lo rimuoviamo automaticamente dal catalogo
          if (res.error?.code === 'not-unique' || res.error?.code === 'invalid') {
            try {
              const del: any = await this.sudokuModel.deleteOne({ _id: sdk._id });
              if (del?.deletedCount > 0) {
                deleted++;
                console.warn(...SDK_PREFIX, `[check] schema "${sdk._id}" rimosso dal catalogo (${res.error.code})`);
              }
            } catch (err: any) {
              console.error(...SDK_PREFIX, `[check] errore rimuovendo "${sdk._id}"`, err?.message || err);
            }
          }
        }
      } else {
        if (environment.debug) console.log(`schema (${index}/${tot}) "${sdk._id}" with right version: ${sdk.info.version}`);
        skipped++;
      }
      if (index >= nextMilestone && index < tot) {
        const pct = Math.floor((index / tot) * 100);
        console.log(...SDK_PREFIX, `progress ${pct}% (${index}/${tot}) — updated: ${updated}, skipped: ${skipped}, failed: ${failed}, deleted: ${deleted}`);
        nextMilestone += step;
      }
    }
    const elapsed = performance.now() - t;
    console.log(...SDK_PREFIX, `checking all schemas done in ${elapsed.toFixed(0)}mls, ${updated} updated, ${skipped} skipped, ${failed} failed, ${deleted} deleted on ${tot}.`);
    await this._persistCheckState({ tot, updated, skipped, failed, deleted, elapsedMs: Math.round(elapsed) });
  }

  /**
   * Certifica ogni schema del catalogo con un solver brute-force indipendente dal
   * catalogo `@olmi/algorithms`. Utile per isolare schemi genuinamente non-univoci
   * (da rimuovere) dai casi in cui il motore catalogato e il brute-force discordano
   * (potenziale bug del motore).
   */
  async verifyUniqueness(): Promise<{
    unique: string[];
    nonUnique: { id: string; count: number }[];
    empty: string[];
    disagreement: { id: string; brute: number; catalog: number; catalogStatus: string }[];
  }> {
    return this.appState.withBusy('verifyUniqueness', () => this._runVerifyUniqueness());
  }

  private async _runVerifyUniqueness() {
    const t = performance.now();
    const sdks = await this.sudokuModel.find().exec();
    const tot = sdks.length;
    console.log(...SDK_PREFIX, `verifying uniqueness of ${tot} schemas start...`);
    const unique: string[] = [];
    const nonUnique: { id: string; count: number }[] = [];
    const empty: string[] = [];
    const disagreement: { id: string; brute: number; catalog: number; catalogStatus: string }[] = [];
    const step = Math.max(1, Math.floor(tot / 10));
    let nextMilestone = step;
    for (let i = 0; i < tot; i++) {
      const sdk = sdks[i];
      this.appState.setProgress(((i + 1) / tot) * 100);
      const brute = countSolutions(sdk.values, 2);
      const cat = getCatalogVerdict(sdk.values);
      if (brute === 0) {
        empty.push(sdk._id);
      } else if (brute === 1 && cat.count === 1) {
        unique.push(sdk._id);
      } else if (brute >= 2 && cat.count >= 2) {
        nonUnique.push({ id: sdk._id, count: brute });
      } else {
        disagreement.push({ id: sdk._id, brute, catalog: cat.count, catalogStatus: cat.status });
        console.warn(...SDK_PREFIX, `disagreement on "${sdk.values}": brute=${brute}, catalog=${cat.count} (${cat.status})`);
      }
      if (i + 1 >= nextMilestone && i + 1 < tot) {
        const pct = Math.floor(((i + 1) / tot) * 100);
        console.log(...SDK_PREFIX, `verify progress ${pct}% (${i + 1}/${tot}) — unique: ${unique.length}, nonUnique: ${nonUnique.length}, empty: ${empty.length}, disagreement: ${disagreement.length}`);
        nextMilestone += step;
      }
    }
    const elapsed = performance.now() - t;
    console.log(...SDK_PREFIX, `verifying uniqueness done in ${elapsed.toFixed(0)}mls, unique: ${unique.length}, nonUnique: ${nonUnique.length}, empty: ${empty.length}, disagreement: ${disagreement.length} on ${tot}.`);
    return { unique, nonUnique, empty, disagreement };
  }

  /**
   * Verifica e (se valido) persiste uno schema.
   *
   * Il flusso è:
   * 1. brute-force → certifica univocità in modo indipendente dal catalogo algoritmi
   *    - count=0 → schema incoerente: `invalid`
   *    - count≥2 → schema non univoco: `not-unique` (da non persistere)
   *    - count=1 → prosegue con (2)
   * 2. motore catalogato → risolve per ricavare sequence/difficulty
   *    - se fallisce → `disagreement` (brute dice unique, catalog non risolve)
   *    - se riesce → persist su Mongo
   */
  private async _check(info: Partial<Sudoku>): Promise<CheckOutcome> {
    const values = info.values || '';
    const sdk = new Sudoku({ values, name: info.name });

    const bruteCount = countSolutions(values, 2);

    if (bruteCount === 0) {
      const message = `schema "${values}" è incoerente (nessuna soluzione trovata)`;
      console.warn(...SDK_PREFIX, `[check] ${message} — non persistito`);
      return { error: { code: 'invalid', message, solutionCount: 0 } };
    }

    if (bruteCount >= 2) {
      const message = `schema "${values}" non è a soluzione unica (trovate almeno ${bruteCount} soluzioni distinte)`;
      console.warn(...SDK_PREFIX, `[check] ${message} — non persistito nel catalogo`);
      return { error: { code: 'not-unique', message, solutionCount: bruteCount } };
    }

    // bruteCount === 1 → schema genuinamente univoco; risolviamo col motore catalogato
    try {
      const sol = await getSudoku(sdk);
      if (!sol) {
        const message = `schema "${values}" risulta univoco al brute-force ma il motore catalogato non lo risolve — POSSIBILE REGRESSIONE del motore`;
        console.error(...SDK_PREFIX, `[check] ${message} — non persistito`);
        return { error: { code: 'disagreement', message, solutionCount: 1 } };
      }
      extendInfo(sol, info);
      const result: any = await this.sudokuModel.updateOne({ _id: sol._id }, { $set: sol }, { upsert: true });
      if (environment.debug) console.log(...SDK_PREFIX, `check results for "${info._id}"`, result);
      if (result?.acknowledged) return { sol };
      const message = `update non acknowledged per schema "${values}"`;
      console.warn(...SDK_PREFIX, `[check] ${message}`);
      return { error: { code: 'persist-error', message } };
    } catch (err: any) {
      const message = `errore durante il check di "${values}": ${err?.message || err}`;
      console.error(...SDK_PREFIX, `[check] ${message}`);
      return { error: { code: 'engine-error', message } };
    }
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
