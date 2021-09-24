import {ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy} from '@angular/core';
import {
  cellId,
  getCellStyle,
  getDimension,
  getLinesGroups,
  isDirectionKey,
  LabFacade,
  PlaySudoku
} from '@sudokulab/model';
import {Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {DestroyComponent} from "../DestroyComponent";

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
  grline$: Observable<{[id: number]: boolean}>;


  constructor(private ele: ElementRef,
              private _lab: LabFacade) {
    super();
    this.playSudoku$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cols$ = this.playSudoku$.pipe(map(s => getDimension(s?.sudoku?.rank)));
    this.cellStyle$ = this.playSudoku$.pipe(map(s => getCellStyle(s?.sudoku, ele.nativeElement.parentElement)));
    this.grline$ = this.playSudoku$.pipe(map(s => getLinesGroups(s?.sudoku)));

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
