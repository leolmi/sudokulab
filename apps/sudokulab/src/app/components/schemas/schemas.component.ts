import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { LabFacade, PlaySudoku, SudokulabSettingsService, use } from '@sudokulab/model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
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
  sortBy$: BehaviorSubject<string>;
  asc$: BehaviorSubject<boolean>;
  try$: BehaviorSubject<boolean>;
  availableSortBy: ItemInfo[];
  counter$: Observable<number>;
  total$: Observable<number>;

  constructor(private _lab: LabFacade,
              private _settings: SudokulabSettingsService) {
    super();
    this._schemas$ = _lab.selectAllSchemas$.pipe(
      takeUntil(this._destroy$));
    this.activeId$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?._id||0));

    this.sortBy$ = _settings.generate<string>('lab.sortBy', '');
    this.asc$ = _settings.generate<boolean>('lab.ascending',false);
    this.try$ = _settings.generate<boolean>('lab.useTry',true);

    this.availableSortBy = [{
      code: 'sudoku.info.difficultyValue',
      description: 'Difficulty'
    }, {
      code: '',
      description: 'Added to repository'
    }];

    this.schemas$ = combineLatest(this._schemas$, this.sortBy$, this.try$, this.asc$).pipe(
      map(([schemas, sort, useTry, asc]) => {
        let sch = (schemas || []).filter(s => useTry || !s.sudoku?.info.useTryAlgorithm);
        if (!!sort) sch = _sortBy(sch, s => _get(s, sort));
        if (asc) sch.reverse();
        return sch;
      }));

    this.counter$ = this.schemas$.pipe(map(sch => (sch||[]).length));
    this.total$ = this._schemas$.pipe(map(sch => (sch||[]).length));
  }

  select(schema: PlaySudoku) {
    this._lab.setActiveSudoku(schema._id);
  }

  applySort(sort: string) {
    this.sortBy$.next(sort);
  }

  toggleAsc() {
    use(this.asc$, asc => this.asc$.next(!asc));
  }
  toggleTry() {
    use(this.try$, t => this.try$.next(!t));
  }
}
