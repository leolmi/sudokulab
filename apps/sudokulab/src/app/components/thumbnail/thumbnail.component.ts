import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import {
  cellId, GeneratorFacade,
  getCellStyle,
  getDimension,
  getLinesGroups,
  getSchemaName,
  isValue,
  Sudoku,
  WorkingInfo
} from '@sudokulab/model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { filter, map } from 'rxjs/operators';
import { forEach as _forEach } from 'lodash';

class CellInfo {
  constructor(public value: string,
              public fixed: boolean) {
  }
}

@Component({
  selector: 'sudokulab-thumbnail',
  templateUrl: './thumbnail.component.html',
  styleUrls: ['./thumbnail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThumbnailComponent {
  private _sdk$: BehaviorSubject<Sudoku|undefined>;
  workingMode$: BehaviorSubject<boolean>;
  working$: Observable<WorkingInfo|undefined>;
  cells$: Observable<Dictionary<CellInfo>>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  description$: Observable<string>;
  grline$: Observable<{[id: number]: boolean}>;
  cellStyle$: Observable<any>;

  @Input() set sudoku(sdk: Sudoku|undefined) {
    this._sdk$.next(sdk);
  };
  @Input() set workingMode(wm: boolean) {
    this.workingMode$.next(wm);
  };
  @Input() unknown: string = 'unknown';
  constructor(private ele: ElementRef,
              private _generator: GeneratorFacade) {
    this._sdk$ = new BehaviorSubject<Sudoku | undefined>(undefined);
    this.workingMode$ = new BehaviorSubject<boolean>(false);
    this.rows$ = this._sdk$.pipe(map(s => getDimension(s?.rank)));
    this.cols$ = this._sdk$.pipe(map(s => getDimension(s?.rank)));
    this.cells$ = this._sdk$.pipe(map(sdk => this._getCells(sdk)));
    this.description$ = this._sdk$.pipe(map(s => getSchemaName(s, { separator: ' ', hideHash: true, unknown: this.unknown })));
    this.grline$ = this._sdk$.pipe(map(s => getLinesGroups(s?.rank)));
    const elem = (<HTMLElement>ele.nativeElement).getElementsByClassName('thumbnail-schema-container');
    this.cellStyle$ = this._sdk$.pipe(map(s => getCellStyle(s, <HTMLElement>elem[0])));

    this.working$ = combineLatest(this.workingMode$, _generator.selectGeneratorWorkingInfo$).pipe(
      map(([wm, info]) => wm ? info : undefined)
    )
  }

  private _getCells(sdk: Sudoku|undefined): Dictionary<CellInfo> {
    const d: Dictionary<CellInfo> = {};
    if (!!sdk) {
      _forEach(sdk.fixed || '', (v, i) => {
        const row = Math.floor(i / sdk.rank);
        const col = i - (row*sdk.rank);
        const cid = cellId(col, row);
        d[cid] = new CellInfo(isValue(v) ? v||'' : '', v !== '0');
      });
    }
    return d;
  }
}
