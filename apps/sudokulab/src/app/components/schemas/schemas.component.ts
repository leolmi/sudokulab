import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { LabFacade, PlaySudoku, SchemasOptions, SudokuFacade, use } from '@sudokulab/model';
import { combineLatest, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DestroyComponent } from '../DestroyComponent';
import { ItemInfo } from '../../model';
import { get as _get, sortBy as _sortBy, reduce as _reduce, values as _values } from 'lodash';
import { filterSchemas } from '../../utils/components.utils';
import {Dictionary} from "@ngrx/entity";

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
  selectedId$: Observable<number>;
  options$: Observable<SchemasOptions>;
  availableSortBy: ItemInfo[];
  counter$: Observable<number>;
  total$: Observable<number>;
  canOpen$: Observable<boolean>;
  userChanges$: Observable<Dictionary<boolean>>;

  constructor(private _lab: LabFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this._schemas$ = _sudoku.selectAllSchemas$.pipe(
      takeUntil(this._destroy$));
    this.activeId$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?._id||0));
    this.options$ = _lab.selectSchemasOptions$.pipe(
      takeUntil(this._destroy$));
    this.selectedId$ = _lab.selectSelectedSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?._id||0));

    this.availableSortBy = [{
      code: 'sudoku.info.difficultyValue',
      description: 'Difficulty'
    }, {
      code: '',
      description: 'Added to repository'
    }];

    this.schemas$ = combineLatest([this._schemas$, this.options$])
      .pipe(map(([ss, o]) => filterSchemas(ss, o)));

    this.counter$ = this.schemas$.pipe(map(sch => (sch||[]).length));
    this.total$ = this._schemas$.pipe(map(sch => (sch||[]).length));
    this.canOpen$ = combineLatest([this.activeId$, this.selectedId$])
      .pipe(map(([aid, sid]) => !!sid && sid !== aid));
    this.userChanges$ = combineLatest([_sudoku.selectUserSettings$, this.schemas$])
      .pipe(map(([us, schemas]) => getSchemasMap(schemas, us)))
  }

  select(schema: PlaySudoku) {
    use(combineLatest(this.selectedId$, this.activeId$), ([sid, aid]) => {
      if (schema._id === sid && schema._id !== aid) {
        this._lab.openSelectedSudoku();
      } else {
        this._lab.setSelectedSudoku(schema._id);
      }
    });

  }

  open() {
    this._lab.openSelectedSudoku();
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

/**
 * Vero se l'utente ha inserito valori
 * @param us
 * @param sdk
 */
const isUserChanged = (us: Partial<PlaySudoku>, sdk: PlaySudoku): boolean => {
  const mc = _values(us?.cells || {}).find(c => !c?.fixed && (!!c?.value || (c?.pencil || []).length > 0));
  // if (mc) console.log(`Schema "${sdk.sudoku?.name||sdk._id}" has changes`, mc);
  return !!mc;
}

const getSchemasMap = (schemas: PlaySudoku[], settings: any): Dictionary<boolean> =>
  _reduce(schemas||[], (d, s) => ({ ...d, [s._id]: isUserChanged(settings[s._id], s)}), {});
