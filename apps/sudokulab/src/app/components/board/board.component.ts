import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
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
import { keys as _keys } from 'lodash';

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
  showAvailables$: Observable<boolean>;
  grline$: Observable<{[id: number]: boolean}>;
  stepInfo$: Observable<SolveStepResult|undefined>;
  highlights$: Observable<Dictionary<boolean>>;
  highlightsCell$: Observable<Dictionary<boolean>>;
  highlightStep$: Observable<Dictionary<boolean>>;

  constructor(private ele: ElementRef,
              private _lab: LabFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);

    this.playSudoku$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.stepInfo$ = _lab.selectStepInfo$.pipe(takeUntil(this._destroy$));
    this.highlightStep$ = _lab.selectHighlightCells$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cols$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cellStyle$ = combineLatest(this.playSudoku$, this._resize$, this._element$).pipe(map(([sdk, r, ele]) =>
      getSchemaCellStyle(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 200)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku?.rank)));
    this.showPencil$ = this.playSudoku$.pipe(map(s => !!s?.options.usePencil));
    this.showAvailables$ = this.playSudoku$.pipe(map(s => !s?.options.usePencil && !!s?.options.showAvailables));
    this.highlights$ = this.stepInfo$.pipe(map(r => getHighlight(r)));
    this.highlightsCell$ = this.stepInfo$.pipe(map(r => getCellHighlight(r)));


    const sti$ = this.stepInfo$.pipe(takeUntil(this._destroy$), filter(si => !!si))
    sti$.subscribe(sti => this._showInfo(sti));
    sti$.pipe(delay(3000)).subscribe(() => _lab.clearStepInfo());

    this.highlightStep$.pipe(filter(hls => _keys(hls).length>0), delay(2000)).subscribe(() => _lab.clesrHighlightCells());
  }

  private _showInfo(sti: SolveStepResult|undefined) {
    const alg = getAlgorithm(sti?.result?.algorithm||'');
    this._lab.raiseMessage(new SudokuMessage({
      message: alg?.name||'',
      type: MessageType.highlight
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
