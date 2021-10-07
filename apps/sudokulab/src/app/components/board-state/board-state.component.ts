import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { DestroyComponent } from '../DestroyComponent';
import { getRank, LabFacade, PlaySudoku, SudokuFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-board-state',
  template: `<div class="board-state" [innerHTML]="bordStateSanitized$|async"></div>`,
  styleUrls: ['./board-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardStateComponent extends DestroyComponent implements OnDestroy {
  bordStateSanitized$: Observable<string>;
  constructor(private _lab: LabFacade, _sudoku: SudokuFacade) {
    super(_sudoku);

    this.bordStateSanitized$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(sdk => stateText(sdk)));
  }
}

const stateText = (sdk: PlaySudoku|undefined): string => {
  if (!sdk) return '';
  const inserted = sdk.state.valuesCount - sdk.state.fixedCount;
  const percent = sdk.state.percent.toFixed(0);
  const rank = getRank(sdk);
  const dimension = rank * rank;
  const remain = dimension - sdk.state.valuesCount;
  return `<b>${inserted}</b> inserted numbers (<b>${percent}%</b>), <b>${remain}</b> numbers remain`;
}
