import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Schema } from '@sudokulab/api-interfaces';
import { Sudoku, SudokuFacade } from '@sudokulab/model';
import { Subject } from 'rxjs';

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  schemas$ = this._http.get<Schema[]>('/api/schemas');

  constructor(private _http: HttpClient,
              private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }

  select(schema: Schema) {
    this._sudoku.loadSudoku(new Sudoku({ fixed: schema.fixed }));
  }
}
