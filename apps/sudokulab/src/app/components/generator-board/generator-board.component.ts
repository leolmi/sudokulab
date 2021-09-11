import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {cellId, getCellStyle, getLinesGroups, PlaySudoku, GeneratorFacade} from "@sudokulab/model";
import {map, takeUntil} from "rxjs/operators";

@Component({
  selector: 'sudokulab-generator-board',
  templateUrl: './generator-board.component.html',
  styleUrls: ['./generator-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorBoardComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  playSudoku$: Observable<PlaySudoku|undefined>;
  selected$: Observable<string>;
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  grline$: Observable<{[id: number]: boolean}>;

  constructor(private ele: ElementRef,
              private _generator: GeneratorFacade) {
    this._destroy$ = new Subject<boolean>();
    this.playSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _generator.selectActiveCell$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cols$ = this.playSudoku$.pipe(map(s => Array(s?.sudoku?.rank||9).fill(0).map((x, i)=>i)));
    this.cellStyle$ = this.playSudoku$.pipe(map(s => getCellStyle(s?.sudoku, ele)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku)));

  }

  select(col: number, row: number) {
    //this._generator.setActiveCell(cellId(col, row));
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
