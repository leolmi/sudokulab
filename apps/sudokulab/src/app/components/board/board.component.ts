import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import {
  cellId,
  getCellStyle,
  getLinesGroups,
  isDirectionKey,
  PlaySudoku,
  SudokuFacade
} from '@sudokulab/model';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  playSudoku$: Observable<PlaySudoku|undefined>;
  selected$: Observable<string>;
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  grline$: Observable<{[id: number]: boolean}>;


  constructor(private ele: ElementRef,
              private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.playSudoku$ = _sudoku.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _sudoku.selectActiveCell$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cols$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cellStyle$ = this.playSudoku$.pipe(map(s => getCellStyle(s?.sudoku, ele)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku)));

  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (isDirectionKey(e?.key)) {
      this._sudoku.move(e?.key);
      e.stopPropagation();
      e.preventDefault();
    } else {
      this._sudoku.setValue(e?.key);
    }
  }

  select(col: number, row: number) {
    this._sudoku.setActiveCell(cellId(col, row));
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
