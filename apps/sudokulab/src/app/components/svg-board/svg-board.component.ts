import { Component, Input } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getRank, Sudoku, SUDOKU_STANDARD_CHARACTERS } from '@sudokulab/model';
import { filter, map } from 'rxjs/operators';

interface SvgCell {
  x: number;
  y: number;
}

@Component({
  selector: 'svg-board',
  template: `<svg class="svg-board" viewBox="0 0 90 90">
    <g>
      <rect x="0" y="0" width="90" height="90" stroke="#aaa" fill="transparent" stroke-width="1"></rect>
      <rect x="30" y="0" width="30" height="90" stroke="#aaa" fill="transparent" stroke-width="1"></rect>
      <rect x="0" y="30" width="90" height="30" stroke="#aaa" fill="transparent" stroke-width="1"></rect>
      <rect *ngFor="let cell of cells$|async" class="svg-board-cell" width="10" height="10" [attr.x]="cell.x" [attr.y]="cell.y"></rect>
    </g>
  </svg>`
})
export class SvgBoardComponent {
  private _sudoku$: BehaviorSubject<Sudoku>;
  cells$: Observable<SvgCell[]>;

  @Input() set sudoku(s: Sudoku|undefined) {
    if (!!s) this._sudoku$.next(s);
  }

  constructor() {
    this._sudoku$ = new BehaviorSubject<Sudoku>(new Sudoku());

    this.cells$ = this._sudoku$.pipe(
      filter(sdk => !!sdk),
      map(sdk => {
        const rank = sdk?.rank || 9;
        const cells: SvgCell[] = [];
        for (let i = 0; i < (rank * rank); i++) {
          const v = sdk.fixed.charAt(i);
          const row = Math.floor(i/9);
          const col = i % 9;
          if (v !== SUDOKU_STANDARD_CHARACTERS.empty) {
            cells.push({ x: 10 * col, y: 10 * row })
          }
        }
        return cells;
      }))
  }
}
