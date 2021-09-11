import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Schema} from '@sudokulab/api-interfaces';
import {Sudoku, SudokuFacade, SudokuInfo} from '@sudokulab/model';
import {Observable, Subject} from 'rxjs';
import {map, takeUntil} from "rxjs/operators";

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  schemas$ = this._http.get<Schema[]>('/api/schemas');
  activeId$: Observable<string>;

  constructor(private _http: HttpClient,
              private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.activeId$ = _sudoku.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?.id||''));
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }

  select(schema: Schema) {
    this._sudoku.loadSudoku(new Sudoku({
      fixed: schema.fixed,
      info: new SudokuInfo(schema.info)
    }));
  }
}
