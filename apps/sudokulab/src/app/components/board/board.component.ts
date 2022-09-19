import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {
  cellId,
  decodeCellId,
  getAlgorithm,
  getDimension,
  getLinesGroups,
  getSchemaCellStyle,
  isDirectionKey,
  LabFacade,
  MessageType,
  PlaySudoku,
  SolveStepResult,
  SUDOKU_DEFAULT_RANK,
  SudokuFacade,
  SudokuMessage
} from '@sudokulab/model';
import { combineLatest, Observable } from 'rxjs';
import { delay, filter, map, takeUntil } from 'rxjs/operators';
import { DestroyComponent } from '../DestroyComponent';
import { Dictionary } from '@ngrx/entity';
import { keys as _keys, last as _last, cloneDeep as _clone } from 'lodash';
import {SOLVER_STEP_DETAILS} from "../../model";

const SHOW_INFO_TIMEOUT = 5000;

@Component({
  selector: 'sudokulab-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  @ViewChild('schemaElement') schemaElement: ElementRef|undefined = undefined;
  playSudoku$: Observable<PlaySudoku|undefined>;
  selected$: Observable<string>;
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  showPencil$: Observable<boolean>;
  showAvailable$: Observable<boolean>;
  grline$: Observable<{[id: number]: boolean}>;
  stepInfos$: Observable<SolveStepResult[]>;
  highlights$: Observable<Dictionary<boolean>>;
  highlightsCell$: Observable<Dictionary<boolean>>;
  highlightStep$: Observable<Dictionary<boolean>>;

  @Input() emptyText: string = '';

  constructor(private ele: ElementRef,
              private _lab: LabFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);

    this.playSudoku$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.stepInfos$ = _lab.selectStepInfos$.pipe(takeUntil(this._destroy$));
    this.highlightStep$ = _lab.selectHighlightCells$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cols$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cellStyle$ = combineLatest(this.playSudoku$, this._resize$, this._element$).pipe(map(([sdk, r, ele]) =>
      getSchemaCellStyle(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 200)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku?.rank)));
    this.showPencil$ = this.playSudoku$.pipe(map(s => !!s?.options.usePencil));
    this.showAvailable$ = this.playSudoku$.pipe(map(s => !s?.options.usePencil && !!s?.options.showAvailables));
    this.highlights$ = this.stepInfos$.pipe(map(r => getHighlight(_last(r))));
    this.highlightsCell$ = this.stepInfos$.pipe(map(r => getCellHighlight(_last(r))));


    const stis$ = this.stepInfos$.pipe(takeUntil(this._destroy$), filter(si => (si||[]).length>0))
    stis$.subscribe(stis => this._showInfo(stis));
    stis$.pipe(delay(SHOW_INFO_TIMEOUT)).subscribe(() => _lab.clearStepInfo());

    this.highlightStep$.pipe(filter(hls => _keys(hls).length>0), delay(2000)).subscribe(() => _lab.clesrHighlightCells());
  }

  private _showInfo(stis: SolveStepResult[]) {
    const alg = getAlgorithm(_last(stis)?.result?.algorithm||'');
    this._lab.raiseMessage(new SudokuMessage({
      message: alg?.name||'',
      type: MessageType.highlight,
      duration: SHOW_INFO_TIMEOUT,
      action: 'Details',
      actionCode: SOLVER_STEP_DETAILS,
      data: _clone(stis)
    }));
  }

  ngAfterViewInit() {
    this._element$.next(this.schemaElement);
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (isDirectionKey(e?.key)) {
      this._lab.move(e?.key);
      e.stopPropagation();
      e.preventDefault();
    } else {
      this._lab.setValue(e?.key);
    }
  }

  select(col: number, row: number) {
    this._lab.setActiveCell(cellId(col, row));
  }
}

const getHighlight = (r: SolveStepResult|undefined) => {
  const hl: Dictionary<boolean> = {};
  (r?.result?.cells||[]).forEach(c => {
    // hl[c] = true;
    const rank = r?.sdk.sudoku?.rank || 9;
    const ci = decodeCellId(c, rank);
    for (let i = 0; i < rank; i++) {
      hl[cellId(i, ci.row)] = true;
      hl[cellId(ci.col, i)] = true;
    }
  });
  return hl;
}

const getCellHighlight = (r: SolveStepResult|undefined) => {
  const hl: Dictionary<boolean> = {};
  (r?.result?.cells||[]).forEach(c => hl[c] = true);
  return hl;
}
