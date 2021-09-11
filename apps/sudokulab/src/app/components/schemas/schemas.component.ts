import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Schema} from '@sudokulab/api-interfaces';
import {LabFacade, Sudoku, SudokuFacade, SudokuInfo} from '@sudokulab/model';
import {Observable, Subject} from 'rxjs';
import {map, takeUntil} from "rxjs/operators";
import {DestroyComponent} from "../DestroyComponent";

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent extends DestroyComponent implements OnDestroy {
  schemas$ = this._http.get<Schema[]>('/api/schemas');
  activeId$: Observable<string>;

  constructor(private _http: HttpClient,
              private _lab: LabFacade) {
    super();
    this.activeId$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?.id||''));
  }

  select(schema: Schema) {
    this._lab.loadSudoku(new Sudoku({
      fixed: schema.fixed,
      info: new SudokuInfo(schema.info)
    }));
  }
}
