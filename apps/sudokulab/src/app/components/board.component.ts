import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy } from '@angular/core';
import { cellId, getCellStyle, getLinesGroups, PlaySudoku, SudokuFacade, use } from '@sudokulab/model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
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
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  grline$: Observable<{[id: number]: boolean}>;
  selected$: BehaviorSubject<string>;

  constructor(private ele: ElementRef,
              private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.playSudoku$ = _sudoku.selectActiveSudoku$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cols$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cellStyle$ = this.playSudoku$.pipe(map(s => getCellStyle(s?.sudoku, ele)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku)));
    this.selected$ = new BehaviorSubject<string>('');
  }

  select(col: number, row: number) {
    this.selected$.next(cellId(col, row));
  }

  inputValue(e: any) {
    use(this.selected$, sel => {
      if (!sel) return;
      console.log('VALUE', e);
    });
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
