import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '@sudokulab/api-interfaces';
import { Algorithms, Sudoku, SudokuFacade } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  hello$ = this.http.get<Message>('/api/hello');
  ALGORITHMS = Algorithms;

  constructor(private http: HttpClient,
              private _sudoku: SudokuFacade) {
    const sudoku = new Sudoku({
      values: '',
      rank: 9,
      fixed: '001090200000003000040510600008002000760030000000460000005700130010005002900000008'
      // fixed: '000100040400900126000007900040000531580000000070600000000009060002750000000002000'
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

  test() {
    this._sudoku.test();
  }
}
