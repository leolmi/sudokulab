import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';
import {DestroyComponent} from '../DestroyComponent';
import {BOARD_DATA, BoardData, getRank, PlaySudoku, SudokuLab} from '@sudokulab/model';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'sudokulab-board-state',
  template: `<div class="board-state" [innerHTML]="bordStateSanitized$|async"></div>`,
  styleUrls: ['./board-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardStateComponent extends DestroyComponent implements OnDestroy {
  bordStateSanitized$: Observable<string> = of('');
  constructor(public sudokuLab: SudokuLab,
              @Inject(BOARD_DATA) private _board: BoardData) {
    super(sudokuLab);

    // this.bordStateSanitized$ = combineLatest([_lab.selectActiveSudoku$, _board.sdk$]).pipe(
    //   takeUntil(this._destroy$),
    //   map(([sdk, wsdk]) => _board.isWorkerAvailable ? wsdk : sdk),
    //   map(sdk => stateText(sdk)));
  }
}

const stateText = (sdk: PlaySudoku|undefined): string => {
  if (!sdk) return '';
  const inserted = sdk.state.valuesCount - sdk.state.fixedCount;
  const percent = sdk.state.percent.toFixed(0);
  const rank = getRank(sdk);
  const dimension = rank * rank;
  const remain = dimension - sdk.state.valuesCount;
  return `<b>${inserted>0 ? inserted : 'no'}</b> inserted numbers (<b>${percent}%</b>)${remain>0 ? `, <b>${remain}</b> to fill` : ''}`;
}
