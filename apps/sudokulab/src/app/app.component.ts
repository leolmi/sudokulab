import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '@sudokulab/api-interfaces';
import { Algorithms, PlaySudoku, Sudoku, SudokuFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  hello$ = this.http.get<Message>('/api/hello');
  state$: Observable<string>;
  ALGORITHMS = Algorithms;

  constructor(private http: HttpClient,
              private _sudoku: SudokuFacade) {
    this.state$ = _sudoku.selectActiveSudoku$.pipe(map(s => s ? `${s.state.percent.toFixed(0)}%` : '0%'));
    const sudoku = new Sudoku({
      values: '',
      rank: 9,
      fixed: '824070060560002000090000000019800020000000070206500000000005002000081009032000100'
      // fixed: '001090200000003000040510600008002000760030000000460000005700130010005002900000008' // (difficile 5%)
      // fixed: '000100040400900126000007900040000531580000000070600000000009060002750000000002000' (facile)
    });
    _sudoku.loadSudoku(sudoku);
    _sudoku.setActiveSudoku(sudoku.id);
  }

  algorithm(alg: string) {
    this._sudoku.applyAlgorithm(alg);
  }

  step() {
    this._sudoku.solveStep();
  }

  clear() {
    this._sudoku.clear();
  }
}
