import {ChangeDetectionStrategy, Component, Input} from "@angular/core";
import {BehaviorSubject, combineLatest, Observable} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {SUDOKU_DEFAULT_RANK, SudokuFacade} from "@sudokulab/model";

interface ValuesTabelCell {
  value: string;
}

interface ValuesTabelRow {
  cells: ValuesTabelCell[];
}

interface ValuesTable {
  rows: ValuesTabelRow[];
}

@Component({
  selector: 'sudokulab-cell-values',
  template: `
  <div class="cell-available-values-container">
    <div class="cell-available-value"
         [style.width.%]="33" [style.height.%]="33"
         *ngFor="let pv of values$|async">{{pv}}<span *ngIf="!pv">&nbsp;</span></div>
  </div>`,
  styleUrls: ['./cell-values.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CellValuesComponent {
  _values$: BehaviorSubject<string[]>;
  private _rank$: BehaviorSubject<number>;
  values$: Observable<string[]>;

  @Input() set values(v: string[]) {
    this._values$.next(v||[]);
  }
  @Input() set rank(r: number|undefined) {
    this._rank$.next(r||SUDOKU_DEFAULT_RANK);
  }

  constructor(private _sudoku: SudokuFacade) {
    this._rank$ = new BehaviorSubject<number>(SUDOKU_DEFAULT_RANK);
    this._values$ = new BehaviorSubject<string[]>([]);

    this.values$ = combineLatest(this._rank$, this._values$, _sudoku.selectValuesMode$).pipe(
      map(([rank, values, mode]) => {
        return Array.from({length: 10}, (_, i) => getValue(`${(i + 1)}`, values, mode));
      }));
  }
}

const getDisplayValue = (v: string, mode: string): string => {
  switch (mode) {
    case 'dot': return '∎';
    default: return v;
  }
}

const getValue = (v: string, values: string[], mode: string): string =>
  (values.indexOf(v)>=0) ? getDisplayValue(v, mode) : '';
