import {Sudoku} from './Sudoku';
import {Dictionary} from '@ngrx/entity';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {SDK_PREFIX, SUDOKU_DEFAULT_RANK, SUDOKU_STANDARD_CHARACTERS} from './consts';
import {cellId, getAvailables, getGroupRank, groupId} from '../sudoku.helper';
import {isDynamic, isValue} from '../global.helper';
import {SudokuGroupType} from './enums';
import {
  cloneDeep as _clone,
  forEach as _forEach,
  includes as _includes,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import {distinctUntilChanged, skipWhile, takeUntil} from 'rxjs/operators';

export class SudokuSchemaGroup {
  constructor(g?: Partial<SudokuSchemaGroup>) {
    this.id = '';
    this.cells = [];
    this._cellValues = {};
    Object.assign(this, g || {});
  }

  id: string;
  cells: SudokuSchemaCell[];
  private _cellValues: Dictionary<string>;

  clear() {
    this._cellValues = {};
  }

  addCell(cell: SudokuSchemaCell, destroyer$: Observable<any>, idle$: BehaviorSubject<boolean>) {
    this.cells.push(cell);
    // cell.value$
    //   .pipe(
    //     takeUntil(destroyer$),
    //     distinctUntilChanged(),
    //     skipWhile(() => idle$.getValue()))
    //   .subscribe(v => {
    //     this._cellValues[cell.id] = v;
    //     const pv = cell.prevalue$.getValue();
    //     const values_map: Dictionary<boolean> = _reduce(this._cellValues, (vls, v) => { vls[v||''] = true; return vls; }, <Dictionary<boolean>>{});
    //     this.cells.forEach(c => {
    //       if (c.id !== cell.id) {
    //         const av = _clone(c.availables$.getValue());
    //         let apply = false;
    //         // se il valore viene modificato o cancellato
    //         if (isValue(pv) && !values_map[pv] && !_includes(av, pv)) {
    //           apply = !!av.push(pv);
    //         }
    //         if (isValue(v)) {
    //           apply = apply || (_remove(av, xv => xv === v).length > 0);
    //         }
    //         av.sort();
    //         if (apply) c.availables$.next(av);
    //       }
    //     });
    //   });
  }
}

export class SudokuSchemaCell {
  constructor(rank: number, c?: Partial<SudokuSchemaCell>) {
    this.rank = rank;
    this.id = '';
    this.fixed = false;
    this.error = '';
    this.value$ = new BehaviorSubject<string>('');
    this.prevalue$ = new BehaviorSubject<string>('');
    this.availables$ = new BehaviorSubject<string[]>([]);
    Object.assign(this, c || {});
    this.resetAvailable();
  }

  id: string;
  rank: number;
  fixed: boolean;
  error: string;
  value$: BehaviorSubject<string>;
  prevalue$: BehaviorSubject<string>;
  availables$: BehaviorSubject<string[]>;
  resetAvailable() {
    this.availables$.next(getAvailables(this.rank));
  }
  setValue(v: string, fixed = false) {
    this.prevalue$.next(this.value$.getValue());
    this.value$.next(v);
    this.fixed = fixed;
  }
  clear() {
    this.prevalue$.next('');
    this.value$.next('');
    this.resetAvailable();
  }
  isValueX(): boolean {
    return isDynamic(this.value$.value || '') && this.fixed;
  }
}

export class SudokuSchema {
  private readonly _destroy$: Subject<any>;
  private readonly _idle$: BehaviorSubject<boolean>;
  constructor(s?: Sudoku) {
    this._destroy$ = new Subject<any>();
    this._idle$ = new BehaviorSubject<boolean>(false);
    this.subscriptions = {};
    this.cells = {};
    this.groups = {};
    this.groupsForCell = {};
    this.rank = s?.rank || SUDOKU_DEFAULT_RANK;
    this._build();
    this.loadFixed(s?.fixed);
  }
  subscriptions: Dictionary<Subscription>;
  rank: number;
  cells: Dictionary<SudokuSchemaCell>;
  groups: Dictionary<SudokuSchemaGroup>;
  groupsForCell: Dictionary<(SudokuSchemaGroup|undefined)[]>;

  private _build() {
    this._destroy$.next({});
    this.groups = {};
    for(let i = 0; i<this.rank; i++) {
      _addGroup(this, SudokuGroupType.column, i);
      _addGroup(this, SudokuGroupType.row, i);
      _addGroup(this, SudokuGroupType.square, i);
    }
    this.cells = {};
    const grank = getGroupRank(this.rank);
    _forEachCells(this, (id, c, r) => {
      const cell = new SudokuSchemaCell(this.rank, { id });
      this.cells[id] = cell;
      const s = Math.floor(r / grank) * grank + Math.floor(c / grank);
      this.groupsForCell[id] = [
        this.groups[groupId(SudokuGroupType.column, c)],
        this.groups[groupId(SudokuGroupType.row, r)],
        this.groups[groupId(SudokuGroupType.square, s)]
      ];
      (this.groupsForCell[id] || []).forEach(g => g?.addCell(cell, this._destroy$, this._idle$));
      cell.value$
        .pipe(
          takeUntil(this._destroy$),
          distinctUntilChanged(),
          skipWhile(() => this._idle$.getValue()))
        .subscribe(v => {
          const prev = cell.prevalue$.getValue();
          const groups = this.groupsForCell[cell.id] || [];
          const values_map: Dictionary<boolean> = _reduce(groups, (vls, g) => {
            (g?.cells || []).forEach(gc => {
              const gcv = gc.value$.getValue();
              if (isValue(gcv)) vls[gcv] = true;
            })
            return vls;
          }, <Dictionary<boolean>>{});
          console.log(`Values map for cell "${cell.id}"`, values_map);
          groups.forEach(g => {
            (g?.cells||[]).forEach(gc => {
              if (gc.id !== cell.id) {
                const av = _clone(gc.availables$.getValue());
                let apply = false;
                if (isValue(prev) && !values_map[prev] && !_includes(av, prev)) {
                  apply = !!av.push(prev);
                }
                if (isValue(v)) {
                  apply = apply || (_remove(av, xv => xv === v).length > 0);
                }
                if (apply) {
                  av.sort();
                  gc.availables$.next(av);
                }
              }
            })
          });
        });
    });
  }


  setValue(id: string, value: string) {
    const cell = this.cells[id];
    if (!!cell && !cell.fixed) cell.setValue(_parseValue(value));
  }

  clear(full = false) {
    this._idle$.next(true);
    let fixed = '';
    _forEachCells(this, (id, c, r) => {
      const cell = this.cells[id];
      if(!!cell) {
        fixed = `${fixed}${cell.fixed ? cell.value$.getValue() : SUDOKU_STANDARD_CHARACTERS.empty}`;
        cell.setValue('');
        cell.availables$.next(getAvailables(this.rank));
      }
    });
    _forEach(this.groups, g => g?.clear());
    this._idle$.next(false);
    if (!full) this.loadFixed(fixed);
  }

  loadFixed(fixed: string|undefined) {
    const dim = this.rank * this.rank;
    fixed = (fixed||'')?.replace(/\s/g, '').trim();
    if ((fixed || '').length !== dim) return console.warn(SDK_PREFIX, 'Invalid fixed string', fixed);
    _forEachCells(this, (id, col, row, index) => {
      const v = (fixed||'').charAt(index);
      if (v !== SUDOKU_STANDARD_CHARACTERS.empty) this.cells[id]?.setValue(v, true);
    });
  }
}


const _forEachCells = (schema: SudokuSchema, handler: (id: string, col: number, row: number, index: number) => any) => {
  for(let r = 0; r < schema.rank; r++) {
    for (let c = 0; c < schema.rank; c++) {
      const id = cellId(c, r);
      const index = (schema.rank * r) + c;
      handler(id, c, r, index);
    }
  }
}

const _parseValue = (v: string): string => {
  if (v === 'Delete') return '';
  return (v||'').trim();
};

const _addGroup = (schema: SudokuSchema, type: SudokuGroupType, pos: number) => {
  const id = groupId(type, pos);
  schema.groups[id] = new SudokuSchemaGroup({ id });
}
