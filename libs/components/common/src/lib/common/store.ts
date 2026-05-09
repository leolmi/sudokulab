import { catchError, take, throwError } from 'rxjs';
import { inject, InjectionToken, signal } from '@angular/core';
import { cloneDeep as _clone, extend as _extend, isArray as _isArray } from 'lodash';
import {
  extendInfo,
  getRandomSchema,
  isEqualCaseInsensitive,
  isExtendedSudoku,
  LogicExecutor,
  NotificationType,
  SDK_PREFIX,
  Sudoku,
  SudokuEx
} from '@olmi/model';
import { Interaction, SUDOKU_API } from './interaction';
import { saveAs } from 'file-saver';
import { clearSchema, getSolution, solve } from '@olmi/logic';
import { Notifier, SUDOKU_NOTIFIER } from './notifier';

/**
 * Catalogo schemi + stato di sincronizzazione con il server.
 *
 * API signal-first: lo stato è esposto come `Signal<T>` readonly (`catalog`,
 * `generated`, `schemaOfTheDay`, `isFilling`, `isFilled`, `isDownload`); le
 * mutazioni passano per metodi pubblici espliciti.
 */
export class SudokuStore {
  private readonly _interaction: Interaction = inject(SUDOKU_API);
  private readonly _notifier: Notifier = inject(SUDOKU_NOTIFIER);

  private readonly _generated = signal<SudokuEx[]>([]);
  private readonly _catalog = signal<Sudoku[]>([]);
  private readonly _schemaOfTheDay = signal<string>('');
  private readonly _isFilling = signal<boolean>(false);
  private readonly _isFilled = signal<boolean>(false);
  private readonly _isDownload = signal<boolean>(!!this._interaction.env.management);

  readonly generated = this._generated.asReadonly();
  readonly catalog = this._catalog.asReadonly();
  readonly schemaOfTheDay = this._schemaOfTheDay.asReadonly();
  readonly isFilling = this._isFilling.asReadonly();
  readonly isFilled = this._isFilled.asReadonly();
  readonly isDownload = this._isDownload.asReadonly();

  private _updateCatalogItem(id: string, handler: (ctg: Sudoku[], item: Sudoku|undefined) => boolean) {
    const cc = _clone(this._catalog());
    const sdk = cc.find(s => s._id === id);
    if (handler(cc, sdk)) this._catalog.set(cc);
  }

  init(executor: LogicExecutor) {
    if (this._isFilling() || this._isFilled()) return;
    this._isFilling.set(true);

    this._interaction.getCatalog()
      .pipe(take(1))
      .subscribe(sdks => this.load(sdks));
  }

  addGeneratedSchema(sdk: SudokuEx) {
    const store = _clone(this._generated());
    if (!store.find(s => s.values === sdk.values)) {
      store.push(sdk);
      this._generated.set(store);
      // schema generato localmente: se il server lo rifiuta lo logghiamo
      // soltanto, non interrompiamo il flusso di generazione
      this.checkSchema(sdk).catch(err =>
        console.warn(...SDK_PREFIX, `generated schema rejected by server (${err?.code})`, err?.message));
    }
  }

  /**
   * verifica lo schema lato server. Se il server risponde 4xx/5xx con
   * un body strutturato (`{ code, message, solutionCount? }`) la Promise
   * viene rigettata con quell'oggetto, così il chiamante può mostrare
   * all'utente un report preciso dell'errore (non univoco, incoerente,
   * regressione motore, ecc.).
   * @param sdk
   */
  checkSchema(sdk: Sudoku): Promise<SudokuEx|undefined> {
    return new Promise<SudokuEx | undefined>((resolve, reject) => {
      try {
        this._interaction
          .checkSchema(sdk)
          .pipe(catchError((err: any) => {
            console.error(...SDK_PREFIX, `error while check schema\n\t${sdk.values}`, err);
            const body = err?.error || {};
            const httpStatus = err?.status;
            // errori generici di rete (status 0, timeout, ecc.) ricadono nella
            // notifica fallback; gli errori strutturati vengono propagati
            if (!body?.code && httpStatus !== 0) {
              this._notifier.notify(`error while check schema`, NotificationType.error);
            }
            return throwError(() => ({
              code: body.code || 'unknown-error',
              message: body.message || err?.message || 'Errore sconosciuto',
              solutionCount: body.solutionCount,
              httpStatus,
            }));
          }))
          .subscribe({
            next: (r: SudokuEx|undefined) => {
              if (r) {
                this._updateCatalogItem(r._id, (ctg, s) => {
                  if (s) {
                    _extend(s, r);
                  } else {
                    ctg.push(r);
                  }
                  return true;
                });
              }
              resolve(r);
            },
            error: (err) => reject(err),
          });
      } catch (err: any) {
        console.error(...SDK_PREFIX, `error while check client schema "${sdk._id}"`, err);
        reject({ code: 'client-error', message: err?.message || 'Errore client', httpStatus: 0 });
      }
    })
  }

  getSudoku(schema: string): Sudoku|undefined {
    return this._catalog().find(s => isEqualCaseInsensitive(s.name, schema) || s.values.startsWith(schema));
  }

  getSudokuEx(schema: string): Promise<SudokuEx|undefined> {
    return new Promise<SudokuEx|undefined>((res) => {
      let sdk = this._catalog().find(s => isEqualCaseInsensitive(s.name, schema) || s.values.startsWith(schema));
      if (isExtendedSudoku(sdk)) {
        res(new SudokuEx(<Partial<SudokuEx>>sdk));
      } else if (sdk) {
        const catalog = _clone(this._catalog());
        const csdk = catalog.find(s => s.values === sdk!.values);
        if (csdk) {
          const sol = solve(csdk);
          const solved = getSolution(sol);
          if (solved) {
            extendInfo(solved, csdk);
            clearSchema(solved.cells);
            _extend(csdk, solved);
            this._catalog.set(catalog);
          }
        }
        res(<SudokuEx>csdk);
      }
    });
  }

  load(sdks: Sudoku[]) {
    if (_isArray(sdks)) {
      this._isFilling.set(false);
      this._catalog.set(sdks);
      const rs = getRandomSchema(sdks);
      this._schemaOfTheDay.set(rs._id);
      this._isFilled.set(true);
    }
  }

  getRandomSchema(): Sudoku {
    return getRandomSchema(this._catalog());
  }

  download() {
    if (!this._interaction.env.management) return;
    const schema_str = JSON.stringify(this._catalog()||[], null, 2);
    const blob = new Blob([schema_str], { type: "application/json;" });
    saveAs(blob, 'sudokulab-store.json');
  }
}

export const SUDOKU_STORE = new InjectionToken<SudokuStore>('SUDOKU_STORE');
