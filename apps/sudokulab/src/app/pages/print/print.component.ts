import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DestroyComponent } from '../../components/DestroyComponent';
import { SudokuFacade } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-print-page',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintComponent extends DestroyComponent {
  constructor(_sudoku: SudokuFacade) {
    super(_sudoku);
  }

}
