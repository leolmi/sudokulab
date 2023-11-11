import {Component, EventEmitter, HostListener, Input, OnDestroy, Output} from "@angular/core";
import {
  BoardWorkerHighlights, clearEvent,
  decodeCellId,
  handleKeyEvent,
  PlaySudoku,
  PlaySudokuCell,
  PlaySudokuOptions,
  SudokuData, useOn
} from "@sudokulab/model";
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from "rxjs";
import {map, switchMap, takeUntil} from "rxjs/operators";
import {forEach as _forEach, reduce as _reduce} from 'lodash';
import {Dictionary} from "@ngrx/entity";

const GEOMETRY: any = {
  width: 10,
  height: 10,
  lineBigWidth: .3,
  lineThinWidth: .1,
  values: {
    '1': {x:1.5, y:3},
    '2': {x:4.5, y:3},
    '3': {x:7.5, y:3},
    '4': {x:1.5, y:6},
    '5': {x:4.5, y:6},
    '6': {x:7.5, y:6},
    '7': {x:1.5, y:9},
    '8': {x:4.5, y:9},
    '9': {x:7.5, y:9},
  }
}

class SvgSize {
  constructor(s?: Partial<SvgSize>) {
    this.x = 0;
    this.y = 0;
    Object.assign(this, s||{});
  }
  x: number;
  y: number;
}

class SvgCell {
  constructor(c: PlaySudokuCell, o?: PlaySudokuOptions) {
    this.cell = c;
    this.id = c?.id;
    const size = getCellCoords(c);
    this.x = size.x
    this.y = size.y
    this.text = (o?.characters||{})[c?.value]||c?.value;
    this.textX = this.x + (GEOMETRY.width/2);
    this.textY = this.y + (GEOMETRY.height/2);
    this.fixed = !!c?.fixed;
    this.error = !!c?.error;
    this.values = (c?.pencil||[]).length>0 ? c?.pencil : (o?.showAvailables ? c?.availables||[] : []);
  }
  id: string;
  x: number;
  y: number;
  textX: number;
  textY: number;
  text: string;
  cell: PlaySudokuCell;
  fixed: boolean;
  error: boolean;
  values: string[];
}

@Component({
  selector: 'svg-interactive-board',
  template: `<svg class="svg-interactive-board"
                  [class.pencil]="pencil$|async"
                  viewBox="0 0 90 90">
    <g>
      <rect x="0" y="0" width="90" height="90"
            class="svg-board-line svg-board-background"
            stroke-width="0"></rect>
      <g *ngFor="let cell of cells$|async">
        <rect class="svg-board-cell"
              [attr.stroke-width]="GEOMETRY.lineThinWidth"
              [class.current]="cell.id === (currentCellId$|async)"
              [class.highlight]="((highlights$|async)?.cell||{})[cell.id]"
              [class.highlight-secondary]="((highlights$|async)?.others||{})[cell.id]"
              (click)="select(cell)"
              [attr.width]="GEOMETRY.width" [attr.height]="GEOMETRY.height"
              [attr.x]="cell.x" [attr.y]="cell.y"></rect>
        <text class="svg-board-cell-text"
              text-anchor="middle"
              dominant-baseline="middle"
              [class.fixed]="cell.fixed"
              [class.error]="cell.error"
              [class.svg-pulse]="((highlights$|async)?.cellValue||{})[cell.id]"
              [attr.x]="cell.textX" [attr.y]="cell.textY+.5">{{cell.text}}</text>
        <ng-container *ngIf="!cell.text">
          <g *ngFor="let vl of cell.values">
            <text class="svg-board-cell-values-text"
                  text-anchor="start"
                  [attr.x]="cell.x+(GEOMETRY.values[vl+'']?.x||0)"
                  [attr.y]="cell.y+(GEOMETRY.values[vl+'']?.y||0)">{{valueMode=='dot'?'∎':vl}}</text>
          </g>
        </ng-container>
      </g>
      <rect x="30" y="-1" width="30" height="100"
            class="svg-board-line"
            fill="transparent"
            [attr.stroke-width]="GEOMETRY.lineBigWidth"></rect>
      <rect x="-1" y="30" width="100" height="30"
            class="svg-board-line"
            fill="transparent"
            [attr.stroke-width]="GEOMETRY.lineBigWidth"></rect>
      <rect class="svg-board-cell svg-selection-cell"
            [attr.width]="GEOMETRY.width" [attr.height]="GEOMETRY.height"
            [attr.x]="(selection$|async)?.x"
            [attr.y]="(selection$|async)?.y"></rect>
    </g>
  </svg>`,
  styleUrls: ['./svg-interactive-board.component.scss']
})
export class SvgInteractiveBoard implements OnDestroy {
  private readonly _destroy$: Subject<void>;
  private _subscriptions: Dictionary<Subscription|null> = {};
  private _sudokuData: SudokuData<any>;
  cells$: Observable<SvgCell[]>;
  sdk$: BehaviorSubject<PlaySudoku>;
  pencil$: Observable<boolean>;
  currentCellId$: BehaviorSubject<string>;
  highlights$: BehaviorSubject<BoardWorkerHighlights>;
  selection$: Observable<SvgSize>;
  GEOMETRY = GEOMETRY;

  @Input()
  set sudokuData(sd: SudokuData<any>) {
    this._sudokuData = sd;
    this._initSudokuData();
  }
  get sudokuData() {
    return this._sudokuData;
  }
  @Input()
  valueMode: string = '';
  @Input()
  set highlights(hl: BoardWorkerHighlights|null) {
    if (hl) this.highlights$.next(hl);
  }

  @Output()
  changed: EventEmitter<PlaySudoku> = new EventEmitter<PlaySudoku>();

  constructor() {
    this._destroy$ = new Subject<void>();
    this._sudokuData = new SudokuData<any>();
    this.sdk$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());
    this.currentCellId$ = new BehaviorSubject<string>('');
    this.highlights$ = new BehaviorSubject<BoardWorkerHighlights>(BoardWorkerHighlights.empty);

    this.pencil$ = this.sdk$.pipe(map(sdk => !!sdk?.options?.usePencil));
    this.cells$ = this.sdk$.pipe(map(sdk => getCells(sdk)));
    this.selection$ = combineLatest([this.sdk$, this.currentCellId$]).pipe(
      map(([sdk, cid])=> (sdk?.cells||{})[cid]),
      map((cell) => getCellCoords(cell)));
  }


  private _initSudokuData() {
    _forEach(this._subscriptions, (s) => s?.unsubscribe());
    if (!this._sudokuData) return;
    this._subscriptions['sdk'] = useOn(this._sudokuData.sdk$, this.sdk$, this._destroy$);
    this._subscriptions['cell'] = useOn(this._sudokuData.activeCellId$, this.currentCellId$, this._destroy$);
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (this.sudokuData.disabled$.value) return;
    clearEvent(e);
    const sdk = handleKeyEvent(this.sudokuData, e);
    this.changed.emit(sdk);
  }

  select(cell: SvgCell) {
    if (this.sudokuData.disabled$.value) return;
    this.sudokuData.activeCellId$.next(cell.id);
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }
}

const getCellCoords = (cell?: PlaySudokuCell): SvgSize => {
  const dic = decodeCellId(cell?.id||'');
  return { x: dic.col * GEOMETRY.width, y: dic.row * GEOMETRY.height };
}

const getCells = (sdk: PlaySudoku): SvgCell[] =>
  _reduce(sdk?.cells||[], (cells, c) =>
    c ? cells.concat(new SvgCell(c, sdk?.options)) : cells, <SvgCell[]>[]);
