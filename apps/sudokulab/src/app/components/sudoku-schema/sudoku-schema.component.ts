import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef, EventEmitter,
  HostListener,
  Input, Output,
  ViewChild
} from '@angular/core';
import {
  cellId,
  decodeCellId,
  getDimension, getFixedCount,
  getLinesGroups,
  getSchemaCellStyle,
  isDirectionKey,
  moveOnDirection,
  parseValue,
  Sudoku,
  SUDOKU_EMPTY_VALUE,
  SudokulabWindowService
} from '@sudokulab/model';
import { map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { cloneDeep as _clone } from 'lodash';
import { Dictionary } from '@ngrx/entity';

class Cell {
  id?: string;
  value?: string;
  fixed?: boolean;
}

@Component({
  selector: 'sudokulab-schema',
  templateUrl: './sudoku-schema.component.html',
  styleUrls: ['./sudoku-schema.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SudokuSchemaComponent implements AfterViewInit {
  private readonly _resize$: BehaviorSubject<any>;
  @ViewChild('schemaElement') schemaElement: ElementRef|undefined = undefined;
  schema$: BehaviorSubject<Sudoku>;
  selected$: BehaviorSubject<string>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  cellStyle$: Observable<any>;
  cells$: BehaviorSubject<Dictionary<Cell>>;
  grline$: Observable<{[id: number]: boolean}>;
  element$: BehaviorSubject<ElementRef|undefined>;

  @Input() set schema(s: Sudoku|null) {
    if (!!s) this.schema$.next(_clone(s));
  }

  @Output() schemaChanged: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  constructor(private _ele: ElementRef,
              private _window: SudokulabWindowService) {
    this._resize$ = new BehaviorSubject<any>({});
    this.element$ = new BehaviorSubject<ElementRef|undefined>(undefined);
    this.schema$ = new BehaviorSubject<Sudoku>(new Sudoku());
    this.selected$ = new BehaviorSubject<string>('');

    this.cells$ = new BehaviorSubject<Dictionary<Cell>>({});

    this.schema$.subscribe(sdk => this.cells$.next(getSchemaCells(sdk)));
    this.rows$ = this.schema$.pipe(map(s => getDimension(s?.rank)));
    this.cols$ = this.schema$.pipe(map(s => getDimension(s?.rank)));
    this.grline$ = this.schema$.pipe(map(s => getLinesGroups(s.rank)));
    this.cellStyle$ = combineLatest(this._resize$, this.element$, this.schema$).pipe(map(([r, ele, schema]) =>
      getSchemaCellStyle(schema?.rank||9, ele?.nativeElement?.clientWidth||200)));
  }

  ngAfterViewInit() {
    setTimeout(() => this.element$.next(this.schemaElement), 250);
  }

  @HostListener('window:resize')
  resize() {
    this._resize$.next({});
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    const sdk = this.schema$.getValue();
    const sel = this.selected$.getValue();
    const cells = this.cells$.getValue();
    if (!sdk || !sel) return;
    if (isDirectionKey(e?.key)) {
      const m = moveOnDirection(sel, sdk, e?.key);
      if (!!m) this.selected$.next(cellId(m.col, m.row));
      e.stopPropagation();
      e.preventDefault();
    } else {
      const nsdk = _clone(sdk);
      setCellFixedValue(nsdk, sel, e?.key);
      this.schema$.next(nsdk);
      this.schemaChanged.emit(nsdk);
    }
  }

  select(col: number, row: number) {
    this.selected$.next(cellId(col, row));
  }

  repaint() {
    this._resize$.next({});
  }
}

const getSchemaCells = (sdk: Sudoku): Dictionary<Cell> => {
  const cells: Dictionary<Cell> = {};
  for(let col = 0; col<sdk.rank; col++) {
    for (let row = 0; row < sdk.rank; row++) {
      const index = (row * sdk.rank) + col;
      const v = parseValue(sdk.fixed.charAt(index), sdk.rank, true);
      cells[cellId(col, row)] = {
        id: cellId(col, row),
        value: v,
        fixed: !!v
      }
    }
  }
  return cells;
}

const setCellFixedValue = (sdk: Sudoku, cellid: string, value: string) => {
  const cid = decodeCellId(cellid);
  const index = (cid.row * sdk.rank) + cid.col;
  const char = parseValue(value, sdk.rank)||SUDOKU_EMPTY_VALUE;
  sdk.fixed = sdk.fixed.substr(0, index) + char + sdk.fixed.substr(index+1);
  sdk.values = sdk.fixed;
}


// import {
//   AfterViewInit,
//   ChangeDetectionStrategy,
//   Component,
//   ElementRef,
//   HostListener,
//   OnDestroy,
//   ViewChild
// } from '@angular/core';
// import {
//   cellId,
//   getDimension,
//   getLinesGroups,
//   getSchemaCellStyle,
//   isDirectionKey,
//   LabFacade,
//   SudokuFacade,
//   SudokulabWindowService,
//   SudokuSchema,
//   use
// } from '@sudokulab/model';
// import { DestroyComponent } from '../DestroyComponent';
// import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
// import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
//
// @Component({
//   selector: 'sudokulab-schema',
//   templateUrl: './sudoku-schema.component.html',
//   styleUrls: ['./sudoku-schema.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class SudokuSchemaComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
//   @ViewChild('schemaElement') schemaElement: ElementRef|undefined = undefined;
//   schema: SudokuSchema;
//   selected$: Observable<string>;
//   rows$: Observable<number[]>;
//   cols$: Observable<number[]>;
//   cellStyle$: Observable<any>;
//   grline$: Observable<{[id: number]: boolean}>;
//   element$: BehaviorSubject<ElementRef|undefined>;
//
//   constructor(private _ele: ElementRef,
//               private _lab: LabFacade,
//               private _window: SudokulabWindowService,
//               _sudoku: SudokuFacade) {
//     super(_sudoku);
//     this.element$ = new BehaviorSubject<ElementRef|undefined>(undefined);
//     this.schema = new SudokuSchema();
//     this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
//     this.rows$ = of(this.schema).pipe(map(s => getDimension(s?.rank)));
//     this.cols$ = of(this.schema).pipe(map(s => getDimension(s?.rank)));
//     this.cellStyle$ = combineLatest(this._resize$, this.element$).pipe(map(([r, ele]) =>
//       getSchemaCellStyle(this.schema.rank, ele?.nativeElement?.clientWidth||200)));
//
//
//     this.grline$ = of(this.schema).pipe(map(s => getLinesGroups(s.rank)));
//
//     _lab.selectActiveSudoku$
//       .pipe(
//         takeUntil(this._destroy$),
//         map(ps => ps?.sudoku),
//         filter(sdk => !!sdk),
//         distinctUntilChanged((s1, s2) => s1?.fixed === s2?.fixed))
//       .subscribe(sdk => {
//         this.schema.clear(true);
//         this.schema.loadFixed(sdk?.fixed);
//       });
//   }
//
//   ngAfterViewInit() {
//     this.element$.next(this.schemaElement);
//   }
//
//   @HostListener('window:resize')
//   resize() {
//     this._resize$.next({});
//   }
//
//   @HostListener('window:keyup', ['$event'])
//   keyEvent(e: KeyboardEvent) {
//     if (isDirectionKey(e?.key)) {
//       this._lab.move(e?.key);
//       e.stopPropagation();
//       e.preventDefault();
//     } else {
//       use(this.selected$, id => this.schema.setValue(id, e?.key));
//     }
//   }
//
//   select(col: number, row: number) {
//     this._lab.setActiveCell(cellId(col, row));
//   }
//
//   repaint() {
//     this._resize$.next({});
//   }
// }
