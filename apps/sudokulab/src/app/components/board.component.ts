import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Sudoku } from '@sudokulab/model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'sudokulab-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent {
  sudoku$: BehaviorSubject<Sudoku|null>;

  @Input()
  set sudoku(s: Sudoku) {
    this.sudoku$.next(s);
  };

  constructor() {
    this.sudoku$ = new BehaviorSubject<Sudoku|null>(null);
  }
}
