import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { cellId, getCellStyle, getDimension, getLinesGroups, getSchemaName, isValue, Sudoku } from '@sudokulab/model';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { map } from 'rxjs/operators';
import { forEach as _forEach } from 'lodash';

@Component({
  selector: 'sudokulab-thumbnail',
  templateUrl: './thumbnail.component.html',
  styleUrls: ['./thumbnail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThumbnailComponent {
  private _sdk$: BehaviorSubject<Sudoku|undefined>;
  cells$: Observable<Dictionary<string>>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  description$: Observable<string>;
  grline$: Observable<{[id: number]: boolean}>;
  cellStyle$: Observable<any>;

  @Input() set sudoku(sdk: Sudoku|undefined) {
    this._sdk$.next(sdk);
  };
  constructor(private ele: ElementRef) {
    this._sdk$ = new BehaviorSubject<Sudoku | undefined>(undefined);
    this.rows$ = this._sdk$.pipe(map(s => getDimension(s?.rank)));
    this.cols$ = this._sdk$.pipe(map(s => getDimension(s?.rank)));
    this.cells$ = this._sdk$.pipe(map(sdk => this._getCells(sdk)));
    this.description$ = this._sdk$.pipe(map(s => getSchemaName(s, ' ')));
    this.grline$ = this._sdk$.pipe(map(s => getLinesGroups(s)));
    this.cellStyle$ = this._sdk$.pipe(map(s => getCellStyle(s, ele)));
  }

  private _getCells(sdk: Sudoku|undefined): Dictionary<string> {
    const d: Dictionary<string> = {};
    if (!!sdk) {
      _forEach(sdk.fixed || '', (v, i) => {
        const row = Math.floor(i / sdk.rank);
        const col = i - (row*sdk.rank);
        const cid = cellId(col, row);
        d[cid] = isValue(v) ? v||'' : '';
      });
    }
    return d;
  }
}
