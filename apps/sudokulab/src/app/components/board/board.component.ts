import {ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy} from '@angular/core';
import {
  cellId, decodeCellId,
  getCellStyle,
  getDimension,
  getLinesGroups,
  isDirectionKey,
  LabFacade,
  PlaySudoku, SolveStepResult, SudokuFacade
} from '@sudokulab/model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { delay, filter, map, takeUntil } from 'rxjs/operators';
import {DestroyComponent} from "../DestroyComponent";
import { Dictionary } from '@ngrx/entity';

@Component({
  selector: 'sudokulab-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent extends DestroyComponent implements OnDestroy {
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


  constructor(private ele: ElementRef,
              private _lab: LabFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this.playSudoku$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.stepInfo$ = _lab.selectStepInfo$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cols$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cellStyle$ = this.playSudoku$.pipe(map(s => getCellStyle(s?.sudoku, ele.nativeElement.parentElement)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku?.rank)));
    this.showPencil$ = this.playSudoku$.pipe(map(s => !!s?.options.usePencil));
    this.showAvailables$ = this.playSudoku$.pipe(map(s => !s?.options.usePencil && !!s?.options.showAvailables));
    this.highlights$ = this.stepInfo$.pipe(map(r => getHighlight(r)));
    this.highlightsCell$ = this.stepInfo$.pipe(map(r => getCellHighlight(r)));

    this.stepInfo$
      .pipe(
        takeUntil(this._destroy$),
        filter(si => !!si),
        delay(3000))
      .subscribe(() => _lab.clearStepInfo());
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
