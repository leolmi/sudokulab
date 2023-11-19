import {Component, EventEmitter, HostListener, Input, OnDestroy, Output} from "@angular/core";
import {
  BoardWorkerHighlights,
  clearEvent,
  decodeCellId,
  handleKeyEvent,
  isDynamic,
  isValidValue,
  PlaySudoku,
  PlaySudokuCell,
  PlaySudokuOptions,
  SudokuData,
  useOn
} from "@sudokulab/model";
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {forEach as _forEach, reduce as _reduce} from 'lodash';
import {Dictionary} from "@ngrx/entity";

interface PopupValue {
  text: string;
}

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
  },
  popup: {
    width: 14,
    values: [
      { text: '1', transform: 'translate(0, -10px)' },
      { text: '2', transform: 'translate(6px, -8.5px)' },
      { text: '3', transform: 'translate(10.6px, -3.2px)' },
      { text: '4', transform: 'translate(10.6px, 3.2px)' },
      { text: '5', transform: 'translate(6px, 8.5px)' },
      { text: '6', transform: 'translate(0px, 10px)' },
      { text: '7', transform: 'translate(-6px, 8.5px)' },
      { text: '8', transform: 'translate(-10.6px, 3.2px)' },
      { text: '9', transform: 'translate(-10.6px, -3.2px)' },
      { text: 'x', transform: 'translate(-6px, -8.5px)' },
    ]
  },
  bigLines: [
    { x1: 30, y1: 0, x2: 30, y2: 90},
    { x1: 60, y1: 0, x2: 60, y2: 90},
    { x1: 0, y1: 30, x2: 90, y2: 30},
    { x1: 0, y1: 60, x2: 90, y2: 60}]
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
    this.x = size?.x||0
    this.y = size?.y||0
    this.text = (o?.characters||{})[c?.value]||c?.value;
    this.textX = this.x + (GEOMETRY.width/2);
    this.textY = this.y + (GEOMETRY.height/2);
    this.fixed = !!c?.fixed;
    this.error = !!c?.error;
    this.hideValues = isValidValue(c.value);
    this.dynamic = isDynamic(c.value);
    this.values = (c?.pencil||[]).length>0 ? c?.pencil : (o?.showAvailables ? c?.availables||[] : []);
  }
  id: string;
  x: number;
  y: number;
  textX: number;
  textY: number;
  text: string;
  hideValues: boolean;
  cell: PlaySudokuCell;
  fixed: boolean;
  dynamic: boolean;
  error: boolean;
  values: string[];
}

@Component({
  selector: 'svg-interactive-board',
  template: `<svg class="svg-interactive-board"
                  [class.pencil]="pencil$|async"
                  [class.disabled]="disabled$|async"
                  [attr.viewBox]="viewBox$|async">
    <g>
      <!-- CONTORNO (light) -->
      <rect x="0" y="0" width="90" height="90"
            class="svg-board-line svg-board-background"
            stroke-width="0"></rect>
      <g *ngFor="let cell of cells$|async">
        <rect class="svg-board-cell"
              [attr.stroke-width]="GEOMETRY.lineThinWidth"
              [class.error]="cell.error"
              [class.dynamic]="cell.dynamic"
              [class.current]="cell.id === (currentCellId$|async)"
              [class.highlight]="((highlights$|async)?.cell||{})[cell.id]"
              [class.highlight-secondary]="((highlights$|async)?.others||{})[cell.id]"
              (click)="select(cell)"
              (mousedown)="showpopup($event, cell)"
              (touchstart)="showpopup($event, cell)"
              [attr.width]="GEOMETRY.width" [attr.height]="GEOMETRY.height"
              [attr.x]="cell.x" [attr.y]="cell.y"></rect>
        <text class="svg-board-cell-text"
              text-anchor="middle"
              dominant-baseline="middle"
              [class.fixed]="cell.fixed"
              [class.error]="cell.error"
              [class.svg-pulse]="((highlights$|async)?.cellValue||{})[cell.id]"
              [attr.x]="cell.textX"
              [attr.y]="cell.textY+.5">{{cell.text}}</text>
        <ng-container *ngIf="!cell.hideValues">
          <!-- AVAILABLE VALUES -->
          <g *ngFor="let vl of cell.values">
            <text class="svg-board-cell-values-text"
                  text-anchor="start"
                  [attr.x]="cell.x+(GEOMETRY.values[vl+'']?.x||0)"
                  [attr.y]="cell.y+(GEOMETRY.values[vl+'']?.y||0)">{{valueMode=='dot'?'∎':vl}}</text>
          </g>
        </ng-container>
      </g>

      <!-- LINNE SPESSE -->
      <line *ngFor="let ln of GEOMETRY.bigLines"
            [attr.x1]="ln.x1" [attr.y1]="ln.y1" [attr.x2]="ln.x2" [attr.y2]="ln.y2"
            class="svg-board-line"
            [attr.stroke-width]="GEOMETRY.lineBigWidth"></line>

      <!-- SELEZIONE -->
      <rect class="svg-board-cell svg-selection-cell"
            *ngIf="(selection$|async) as sel"
            [attr.width]="GEOMETRY.width" [attr.height]="GEOMETRY.height"
            [attr.x]="sel?.x"
            [attr.y]="sel?.y"></rect>
    </g>

    <g *ngIf="popup$|async as pop"
       (mouseup)="hidepopup()"
       (mouseleave)="hidepopup()"
       (touchmove)="touchmove($event)"
       (touchend)="hidepopup()"
       (touchcancel)="hidepopup()">
      <circle class="svg-board-popup-selection"
              [attr.cx]="pop.textX" [attr.cy]="pop.textY"
              [attr.r]="GEOMETRY.popup.width"/>
      <text class="popup-watch-value"
            text-anchor="middle"
            dominant-baseline="middle"
            [attr.x]="pop.textX"
            [attr.y]="pop.textY">{{watchValue$|async}}</text>
      <text *ngFor="let pv of GEOMETRY.popup.values"
            class="popup-value"
            text-anchor="middle"
            dominant-baseline="middle"
            (mouseup)="hidepopup(pv)"
            (touchend)="hidepopup(pv)"
            (mouseover)="watchvalue($event, pv)"
            (touchmove)="watchvalue($event, pv)"
            [style.transform]="pv.transform"
            [attr.x]="pop.textX"
            [attr.y]="pop.textY">{{pv.text}}</text>
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
  disabled$: BehaviorSubject<boolean>
  currentCellId$: BehaviorSubject<string>;
  highlights$: BehaviorSubject<BoardWorkerHighlights>;
  selection$: Observable<SvgSize|undefined>;
  viewBox$: Observable<string>;
  GEOMETRY = GEOMETRY;

  popup$: BehaviorSubject<SvgCell|undefined>;
  watchValue$: BehaviorSubject<string|undefined>;


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
    this.disabled$ = new BehaviorSubject<boolean>(false);
    this.highlights$ = new BehaviorSubject<BoardWorkerHighlights>(BoardWorkerHighlights.empty);
    this.popup$ = new BehaviorSubject<SvgCell|undefined>(undefined);
    this.watchValue$ = new BehaviorSubject<string | undefined>(undefined);
    this.pencil$ = this.sdk$.pipe(map(sdk => !!sdk?.options?.usePencil));
    this.cells$ = this.sdk$.pipe(map(sdk => getCells(sdk)));
    this.selection$ = combineLatest([this.sdk$, this.currentCellId$]).pipe(
      map(([sdk, cid])=> (sdk?.cells||{})[cid]),
      map((cell) => getCellCoords(cell)));
    this.viewBox$ = this.sudokuData.userData$.pipe(
      map(ud => ud?.options?.usePopupKeys),
      distinctUntilChanged(),
      map(popk => popk ? '-10 -10 110 110' : '0 0 90 90'));
  }


  private _initSudokuData() {
    _forEach(this._subscriptions, (s) => s?.unsubscribe());
    if (!this._sudokuData) return;
    this._subscriptions['sdk'] = useOn(this._sudokuData.sdk$, this.sdk$, this._destroy$);
    this._subscriptions['cell'] = useOn(this._sudokuData.activeCellId$, this.currentCellId$, this._destroy$);
    this._subscriptions['disabled'] = useOn(this._sudokuData.disabled$, this.disabled$, this._destroy$);
  }

  private _apply(e: KeyboardEvent) {
    const sdk = handleKeyEvent(this.sudokuData, e);
    this.changed.emit(sdk);
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (this.sudokuData.disabled$.value) return;
    clearEvent(e);
    this._apply(e);
  }

  select(cell: SvgCell) {
    if (this.sudokuData.disabled$.value) return;
    this.sudokuData.activeCellId$.next(cell.id);
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  showpopup(e: any, cell: SvgCell) {
    // console.log('TOUCHSTART', e);
    // clearEvent(e);
    const ud = this.sudokuData.userData$.value;
    if (this.sudokuData.disabled$.value || !ud?.options?.usePopupKeys) return;
    this.select(cell);
    this.watchValue$.next(cell.text);
    this.popup$.next(cell);
  }

  hidepopup(v?: PopupValue) {
    this.watchValue$.next(undefined);
    if (v) {
      const key = calcKey(v.text, this.sdk$.value, this.popup$.value);
      this._apply(<KeyboardEvent>{key});
    }
    this.popup$.next(undefined);
  }

  touchmove(e: any) {
    // const x = e.touches[0]?.clientX;
    // const y = e.touches[0]?.clientY;
    // console.log(`TOUCH x=${x}  y=${y}`, e);
    clearEvent(e);
  }

  watchvalue(e: any, v?: PopupValue){
    clearEvent(e);
    // console.log('TOUCHMOVE 1', e);
    this.watchValue$.next(v?.text);
  }
}

const calcKey = (text: string, sdk: PlaySudoku, cell?: SvgCell): string => {
  if (sdk.options.acceptX && text==='x')
    return isDynamic(cell?.text||'') ? ' ' : 'x';
  return (!sdk.options.acceptX && isDynamic(text)) ? ' ' : text;
}

const getCellCoords = (cell?: PlaySudokuCell): SvgSize|undefined => {
  if (!cell) return undefined;
  const dic = decodeCellId(cell?.id||'');
  return { x: dic.col * GEOMETRY.width, y: dic.row * GEOMETRY.height };
}

const getCells = (sdk: PlaySudoku): SvgCell[] =>
  _reduce(sdk?.cells||[], (cells, c) =>
    c ? cells.concat(new SvgCell(c, sdk?.options)) : cells, <SvgCell[]>[]);
