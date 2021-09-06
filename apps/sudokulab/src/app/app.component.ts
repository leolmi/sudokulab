import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '@sudokulab/api-interfaces';
import { Sudoku } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  hello$ = this.http.get<Message>('/api/hello');

  sudoku: Sudoku;

  constructor(private http: HttpClient) {
    this.sudoku = new Sudoku({
      values: '',
      rank: 9,
      fixed: '000100040400900126000007900040000531580000000070600000000009060002750000000002000'
    });
  }
}
