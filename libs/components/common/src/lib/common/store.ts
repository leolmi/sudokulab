import { BehaviorSubject, catchError, of, take } from 'rxjs';
import { inject, InjectionToken } from '@angular/core';
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

export class SudokuStore {
  private readonly _interaction: Interaction;
  private readonly _notifier: Notifier;
  generated$: BehaviorSubject<SudokuEx[]>;
  catalog$: BehaviorSubject<Sudoku[]>;
  schemaOfTheDay$: BehaviorSubject<string>;

  isFilling$: BehaviorSubject<boolean>;
  isFilled$: BehaviorSubject<boolean>;
  isDownload$: BehaviorSubject<boolean>;

  constructor() {
    this._interaction = inject(SUDOKU_API);
    this._notifier = inject(SUDOKU_NOTIFIER);
    this.isFilled$ = new BehaviorSubject<boolean>(false);
    this.isFilling$ = new BehaviorSubject<boolean>(false);
    this.isDownload$ = new BehaviorSubject<boolean>(!!this._interaction.env.management);
    this.generated$ = new BehaviorSubject<SudokuEx[]>([]);
    this.catalog$ = new BehaviorSubject<Sudoku[]>([]);
    this.schemaOfTheDay$ = new BehaviorSubject<string>('');
  }

  private _updateCatalogItem(id: string, handler: (ctg: Sudoku[], item: Sudoku|undefined) => boolean) {
    const cc = _clone(this.catalog$.value);
    const sdk = cc.find(s => s._id === id);
    if (handler(cc, sdk)) this.catalog$.next(cc);
  }

  init(executor: LogicExecutor) {
    if (this.isFilling$.value || this.isFilled$.value) return;
    this.isFilling$.next(true);

    this._interaction.getCatalog()
      .pipe(take(1))
      .subscribe(sdks => this.load(sdks));
  }

  addGeneratedSchema(sdk: SudokuEx) {
    const store = _clone(this.generated$.value);
    if (!store.find(s => s.values === sdk.values)) {
      store.push(sdk);
      this.generated$.next(store);
      this.checkSchema(sdk);
    }
  }

  /**
   * verifica lo schema lato server e nel caso risulti uno schema valido
   * ne verifica la presenza nello store
   * @param sdk
   */
  checkSchema(sdk: Sudoku): Promise<SudokuEx|undefined> {
    return new Promise<SudokuEx | undefined>((res) => {
      try {
        this._interaction
          .checkSchema(sdk)
          .pipe(catchError((err) => {
            this._notifier.notify(`error while check schema`, NotificationType.error);
            console.error(...SDK_PREFIX, `error while check schema\n\t${sdk.values}`, err);
            return of(undefined);
          }))
          .subscribe((r: SudokuEx|undefined) => {
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
            res(r);
          })
      } catch (err: any) {
        console.error(...SDK_PREFIX, `error while check client schema "${sdk._id}"`, err);
        res(undefined);
      }
    })
  }

  getSudoku(schema: string): Sudoku|undefined {
    return this.catalog$.value.find(s => isEqualCaseInsensitive(s.name, schema) || s.values.startsWith(schema));
  }

  getSudokuEx(schema: string): Promise<SudokuEx|undefined> {
    return new Promise<SudokuEx|undefined>((res) => {
      let sdk = this.catalog$.value.find(s => isEqualCaseInsensitive(s.name, schema) || s.values.startsWith(schema));
      if (isExtendedSudoku(sdk)) {
        res(new SudokuEx(<Partial<SudokuEx>>sdk));
      } else if (sdk) {
        const catalog = _clone(this.catalog$.value);
        const csdk = catalog.find(s => s.values === sdk!.values);
        if (csdk) {
          const sol = solve(csdk);
          const solved = getSolution(sol);
          if (solved) {
            extendInfo(solved, csdk);
            clearSchema(solved.cells);
            _extend(csdk, solved);
            this.catalog$.next(catalog);
          }
        }
        res(<SudokuEx>csdk);
      }
    });
  }

  load(sdks: Sudoku[]) {
    if (_isArray(sdks)) {
      this.isFilling$.next(false);
      this.catalog$.next(sdks);
      const rs = getRandomSchema(sdks);
      this.schemaOfTheDay$.next(rs._id);
      this.isFilled$.next(true);
    }
  }

  getRandomSchema(): Sudoku {
    return getRandomSchema(this.catalog$.value);
  }

  download() {
    if (!this._interaction.env.management) return;
    const schema_str = JSON.stringify(this.catalog$.value||[], null, 2);
    const blob = new Blob([schema_str], { type: "application/json;" });
    saveAs(blob, 'sudokulab-store.json');
  }
}

export const SUDOKU_STORE = new InjectionToken<SudokuStore>('SUDOKU_STORE');
