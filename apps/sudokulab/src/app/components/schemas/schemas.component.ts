import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { LabFacade, PlaySudoku, SchemasOptions, SudokuFacade, use } from '@sudokulab/model';
import { combineLatest, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DestroyComponent } from '../DestroyComponent';
import { ItemInfo } from '../../model';
import { get as _get, sortBy as _sortBy } from 'lodash';

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent extends DestroyComponent implements OnDestroy {
  private _schemas$: Observable<PlaySudoku[]>;
  schemas$: Observable<PlaySudoku[]>;
  activeId$: Observable<number>;
  options$: Observable<SchemasOptions>;
  availableSortBy: ItemInfo[];
  counter$: Observable<number>;
  total$: Observable<number>;

  constructor(private _lab: LabFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this._schemas$ = _lab.selectAllSchemas$.pipe(
      takeUntil(this._destroy$));
    this.activeId$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?._id||0));
    this.options$ = _lab.selectSchemasOptions$.pipe(
      takeUntil(this._destroy$));

    this.availableSortBy = [{
      code: 'sudoku.info.difficultyValue',
      description: 'Difficulty'
    }, {
      code: '',
      description: 'Added to repository'
    }];

    this.schemas$ = combineLatest(this._schemas$, this.options$).pipe(
      map(([schemas, options]) => {
        let sch = (schemas || []).filter(s => options.try || !s.sudoku?.info.useTryAlgorithm);
        if (!!options.sortBy) sch = _sortBy(sch, s => _get(s, options.sortBy));
        if (options.asc) sch.reverse();
        return sch;
      }));

    this.counter$ = this.schemas$.pipe(map(sch => (sch||[]).length));
    this.total$ = this._schemas$.pipe(map(sch => (sch||[]).length));
  }

  select(schema: PlaySudoku) {
    this._lab.setActiveSudoku(schema._id);
  }

  applySort(sortBy: string) {
    use(this.options$, o => this._lab.updateSchemasOptions({ sortBy }));
  }

  toggleAsc() {
    use(this.options$, o => this._lab.updateSchemasOptions({ asc: !o.asc }));
  }
  toggleTry() {
    use(this.options$, o => this._lab.updateSchemasOptions({ try: !o.try }));
  }
}
