import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { getAvailables, getValues, isValue, LabFacade, PlaySudokuCell, SudokuFacade, use } from '@sudokulab/model';
import { DestroyComponent } from '../DestroyComponent';
import { map, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { forEach as _forEach } from 'lodash';

@Component({
  selector: 'sudokulab-key-board',
  templateUrl: './key-board.component.html',
  styleUrls: ['./key-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyBoardComponent extends DestroyComponent implements OnDestroy {
  numbers$: Observable<string[]>;
  status$: Observable<Dictionary<boolean>>;
  isCellSelected$: Observable<boolean>;
  isPencil$: Observable<boolean>;

  constructor(private _lab: LabFacade, _sudoku: SudokuFacade) {
    super(_sudoku);
    this.numbers$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(sdk => getAvailables(sdk?.sudoku?.rank || 9).concat('x')));

    this.isCellSelected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$), map(sc => !!sc));

    this.status$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(sdk => {
        const rank = sdk?.sudoku?.rank || 9;
        const status: Dictionary<boolean> = {};
        const status_n: Dictionary<number> = {};
        _forEach(sdk?.cells || {}, (c: any) => {
          if (isValue(c?.value)) status_n[c.value] = (status_n[c.value] || 0) + 1;
        });
        _forEach(status_n, (v, k) => {
          status[k] = ((v || 0) >= rank);
        });
        return status;
      }));

    this.isPencil$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(sdk => !!sdk?.options.usePencil));
  }

  clickOnNumber(num: string) {
    if (num === 'x') num = ' ';
    this._lab.setValue(num);
  }

  togglePencil() {
    use(this.isPencil$, pencil => this._lab.updatePlayerOptions({ usePencil: !pencil }));
  }
}
