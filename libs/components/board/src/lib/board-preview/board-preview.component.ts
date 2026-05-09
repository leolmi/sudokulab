import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Sudoku } from '@olmi/model';
import { BoardCell } from '../board/board.model';
import { getBoardCells } from '../board/board.helper';

@Component({
  selector: 'sudoku-board-preview',
  template: `<svg class="sudoku-board-preview" viewBox="0 0 90 90">
    <g>
      <rect class="grid" x="0" y="0" width="90" height="90" fill="transparent" stroke-width="1"></rect>
      <rect class="grid" x="30" y="0" width="30" height="90" fill="transparent" stroke-width="1"></rect>
      <rect class="grid" x="0" y="30" width="90" height="30" fill="transparent" stroke-width="1"></rect>
      @for (cell of cells(); track cell.id) {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class BoardPreviewComponent {
  readonly schema = input<Sudoku | string | null | undefined>(undefined);

  readonly cells = computed<BoardCell[]>(() => getBoardCells(this.schema(), true));
}
