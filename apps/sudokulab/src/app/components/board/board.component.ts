import {ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild} from '@angular/core';
import {
  cellId,
  debug,
  decodeCellId,
  getAlgorithm,
  getDimension,
  getLinesGroups,
  getSchemaCellStyle,
  isDirectionKey,
  MessageType,
  PlaySudoku,
  PlaySudokuOptions,
  SolveStepResult,
  SUDOKU_DEFAULT_RANK,
  SudokuLab,
  SudokuMessage
} from '@sudokulab/model';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import {DestroyComponent} from '../DestroyComponent';
import {Dictionary} from '@ngrx/entity';
import {cloneDeep as _clone, keys as _keys, last as _last} from 'lodash';
import {SOLVER_STEP_DETAILS} from "../../model";
import * as equal from 'fast-deep-equal';

const DEFAULT_SHOW_INFO_TIMEOUT = 5000;

@Component({
  selector: 'sudokulab-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent extends DestroyComponent implements OnDestroy {
  @ViewChild('schemaElement') set schemaElement(e: ElementRef|undefined) {
    this._element$.next(e);
  };
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
  highlightsCell$: BehaviorSubject<Dictionary<boolean>>;
  otherHighlightsCells$: BehaviorSubject<Dictionary<boolean>>;
  highlightStep$: Observable<Dictionary<boolean>>;


  @Input() emptyText: string = '';

  @Input() set highLight(c: Dictionary<boolean>|null) {
    if (c) this.highlightsCell$.next(c);
  };

  @Input() set otherHighLight(c: Dictionary<boolean>|null) {
    this.otherHighlightsCells$.next(c||{});
  };

  constructor(private ele: ElementRef,
              public sudokuLab: SudokuLab) {
    super(sudokuLab);

    this.highlightsCell$ = new BehaviorSubject<Dictionary<boolean>>({});
    this.otherHighlightsCells$ = new BehaviorSubject<Dictionary<boolean>>({});

    this.playSudoku$ = of(undefined); // _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = of(''); // _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.stepInfos$ = of([]); // _lab.selectStepInfos$.pipe(takeUntil(this._destroy$));
    this.highlightStep$ = of({}); // _lab.selectHighlightCells$.pipe(takeUntil(this._destroy$));


    this.rows$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)),
        distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.cols$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)),
        distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.cellStyle$ = combineLatest([this.playSudoku$, this._resize$, this._element$])
        .pipe(map(([sdk, r, ele]) =>
            getSchemaCellStyle(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 200)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku?.rank)),
        distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.showPencil$ = this.playSudoku$.pipe(map(s => !!s?.options.usePencil),
        distinctUntilChanged());
    this.showAvailable$ = this.playSudoku$.pipe(map(s => !!s?.options.showAvailables),
        distinctUntilChanged((o1, o2) => equal(o1, o2)));
    this.highlights$ = this.stepInfos$.pipe(map(r => getHighlight(_last(r))),
        distinctUntilChanged((d1, d2) => equal(d1, d2)));

    this.stepInfos$.pipe(
        takeUntil(this._destroy$),
        debounceTime(100),
        map(r => getCellHighlight(_last(r))),
        distinctUntilChanged((d1, d2) => equal(d1, d2)))
      .subscribe(hl => this.highlightsCell$.next(hl));

    const stis$ = this.stepInfos$.pipe(
        takeUntil(this._destroy$),
        debounceTime(100),
        filter(si => (si||[]).length > 0),
        withLatestFrom(this.playSudoku$));

    stis$.subscribe(([ssr, sdk]) =>
      this._showInfo(ssr, sdk?.options));
    // stis$.pipe(
    //     switchMap(([ssr, sdk]) =>
    //         of(ssr).pipe(delay(sdk?.options?.highlightsDelay||DEFAULT_SHOW_INFO_TIMEOUT))))
    //             .subscribe(() => _lab.clearStepInfo());

    // this.highlightStep$.pipe(
    //     filter(hls => _keys(hls).length>0),
    //     withLatestFrom(this.playSudoku$),
    //     switchMap(([hls, sdk]) => of(hls).pipe(
    //         debounceTime(sdk?.options?.highlightsDelay||DEFAULT_SHOW_INFO_TIMEOUT))))
    //   .subscribe(() => _lab.clesrHighlightCells());

    this.highlightsCell$.pipe(
        filter(hlc => _keys(hlc).length>0),
        withLatestFrom(this.playSudoku$),
        switchMap(([hlc, sdk]) => of(hlc).pipe(
            debounceTime(sdk?.options?.highlightsDelay||DEFAULT_SHOW_INFO_TIMEOUT))))
        .subscribe(() => this._clearHighlights());
  }

  private _clearHighlights() {
    this.highlightsCell$.next({});
    this.otherHighlightsCells$.next({});
  }

  private _showInfo(stis: SolveStepResult[], options?: PlaySudokuOptions) {
    const alg = getAlgorithm(_last(stis)?.result?.algorithm||'');
    this.sudokuLab.showMessage(new SudokuMessage({
      message: alg?.name||'',
      type: MessageType.highlight,
      duration: options?.highlightsDelay||DEFAULT_SHOW_INFO_TIMEOUT,
      action: options?.showPopupDetails ? 'Details' : '',
      actionCode: SOLVER_STEP_DETAILS,
      data: _clone(stis)
    }));
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (isDirectionKey(e?.key)) {
      //this._lab.move(e?.key);
      e.stopPropagation();
      e.preventDefault();
    } else {
      //this._lab.setValue(e?.key);
    }
  }

  select(col: number, row: number) {
    const cid = cellId(col, row);
    //this._lab.setActiveCell(cid);
    debug(() => this.playSudoku$
      .pipe(take(1))
      .subscribe(sdk => console.log(`CELL (${cid})`, sdk?.cells[cid])));
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
