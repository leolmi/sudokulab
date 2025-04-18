import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { buildSudokuCells, Sudoku, SudokuCell } from '@olmi/model';
import { CommonModule } from '@angular/common';
import { BoardCell } from '../board/board.model';
import { getBoardCells, parseCells } from '../board/board.helper';
import { isObject, isString } from 'lodash';

@Component({
  selector: 'sudoku-board-preview',
  template: `<svg class="sudoku-board-preview" viewBox="0 0 90 90">
    <g>
      <rect class="grid" x="0" y="0" width="90" height="90" fill="transparent" stroke-width="1"></rect>
      <rect class="grid" x="30" y="0" width="30" height="90" fill="transparent" stroke-width="1"></rect>
      <rect class="grid" x="0" y="30" width="90" height="30" fill="transparent" stroke-width="1"></rect>
      @for (cell of cells$|async; track cell.id) {
        <rect class="svg-board-cell"
              width="10"
              height="10"
              [attr.x]="cell.x"
              [attr.y]="cell.y"
        ></rect>
      }
    </g>
  </svg>`,
  standalone: true,
  styleUrls: ['./board-preview.component.scss'],
  imports: [
    CommonModule
  ]
})
export class BoardPreviewComponent {
  cells$: BehaviorSubject<BoardCell[]>

  @Input()
  set schema(s: Sudoku|string|null|undefined) {
    const cells = getBoardCells(s, true);
    this.cells$.next(cells);
  }

  constructor() {
    this.cells$ = new BehaviorSubject<BoardCell[]>([]);
  }
}
