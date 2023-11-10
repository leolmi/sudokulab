import {AfterViewInit, ChangeDetectionStrategy, Component, Inject, Input, NgZone, OnDestroy} from "@angular/core";
import {DestroyComponent} from "../DestroyComponent";
import {BOARD_DATA, BoardData, BoardDataManager, SudokuLab} from "@sudokulab/model";
import {Observable, of} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";


@Component({
  selector: 'sudokulab-board-worker',
  templateUrl: './board-worker.component.html',
  styleUrls: ['./board-worker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardWorkerComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  valueMode$: Observable<string>;

  @Input()
  emptyText: string = 'select a schema';

  constructor(public sudokuLab: SudokuLab,
              private _zone: NgZone,
              private _dialog: MatDialog,
              @Inject(BOARD_DATA) public board: BoardData) {
    super(sudokuLab);
    this.valueMode$ = of(''); //_sudoku.selectValuesMode$.pipe(takeUntil(this._destroy$));
    if (!board.manager) {
      board.manager = new BoardDataManager(_zone, sudokuLab, board, { saveDataOnChanges: true });
    }

    _dialog.afterOpened.pipe(takeUntil(this._destroy$)).subscribe(() => board.manager?.data.disabled$.next(true));
    _dialog.afterAllClosed.pipe(takeUntil(this._destroy$)).subscribe(() => board.manager?.data.disabled$.next(false));
  }

  changed() {
    this.board.manager?.changed();
  }

  ngAfterViewInit() {
    this.board.manager?.init(() => new Worker(new URL('./board.worker', import.meta.url)));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }
}
