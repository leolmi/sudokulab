import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';
import {BOARD_DATA, BoardData, BoardUserData, PlaySudoku, Sudoku, SudokuLab, use} from '@sudokulab/model';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map, take} from 'rxjs/operators';
import {DestroyComponent} from '../DestroyComponent';
import {ItemInfo} from '../../model';
import {isEqual as _isEqual, reduce as _reduce, values as _values} from 'lodash';
import {filterSchemas} from '../../utils/components.utils';
import {Dictionary} from "@ngrx/entity";

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent extends DestroyComponent implements OnDestroy {
  schemas$: BehaviorSubject<Sudoku[]>;
  availableSortBy: ItemInfo[];
  counter$: Observable<number>;
  total$: Observable<number>;
  canOpen$: Observable<boolean>;
  userChanges$: Observable<Dictionary<any>>;

  constructor(public sudokuLab: SudokuLab,
              @Inject(BOARD_DATA) private _board: BoardData) {
    super(sudokuLab);

    this.availableSortBy = [{
      code: 'info.difficultyValue',
      description: 'Difficulty'
    }, {
      code: '',
      description: 'Added to repository'
    }];

    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);

    combineLatest([this.sudokuLab.state.schemas$, this.sudokuLab.state.schemasOptions$]).pipe(
      distinctUntilChanged(([s1,o1],[s2,o2]) =>
        (s1||[]).length === (s2||[]).length && _isEqual(o1, o2)))
      .subscribe(([ss, o]) => this.schemas$.next(filterSchemas(ss, o)));

    this.counter$ = this.schemas$.pipe(map(sch => (sch||[]).length));
    this.total$ = this.sudokuLab.state.schemas$.pipe(map(sch => (sch||[]).length));
    this.canOpen$ = combineLatest([this.sudokuLab.state.activeSudokuId$, this.sudokuLab.state.selectedSudokuId$])
      .pipe(map(([aid, sid]) => !!sid && sid !== aid));
    this.userChanges$ = combineLatest([sudokuLab.state.userSettings$, this.schemas$, _board.userData$])
      .pipe(map(([us, schemas, udata]) =>
        _board.isWorkerAvailable ? ((<BoardUserData>udata)?.schema||{}) : getSchemasMap(schemas, us)));
  }

  select(schema: Sudoku) {
    combineLatest([this.sudokuLab.state.selectedSudokuId$, this.sudokuLab.state.activeSudokuId$])
      .pipe(take(1))
      .subscribe(([sid, aid]) => {
      if (schema._id === sid && schema._id !== aid) {
        this.open();
      } else {
        this.sudokuLab.state.selectedSudokuId$.next(schema._id);
      }
    });

  }

  open() {
    this.sudokuLab.activateSelectedSchema();
  }

  applySort(sortBy: string) {
    this.sudokuLab.updateSchemasOptions({ sortBy })
  }

  toggleAsc() {
    const o = this.sudokuLab.state.schemasOptions$.value;
    this.sudokuLab.updateSchemasOptions({ asc: !o.asc });
  }
  toggleTry() {
    const o = this.sudokuLab.state.schemasOptions$.value;
    this.sudokuLab.updateSchemasOptions({ try: !o.try });
  }
}

/**
 * Vero se l'utente ha inserito valori
 * @param us
 * @param sdk
 */
const isUserChanged = (us: Partial<PlaySudoku>, sdk: Sudoku): boolean => {
  const mc = _values(us?.cells || {}).find(c => !c?.fixed && (!!c?.value || (c?.pencil || []).length > 0));
  // if (mc) console.log(`Schema "${sdk.sudoku?.name||sdk._id}" has changes`, mc);
  return !!mc;
}

const getSchemasMap = (schemas: Sudoku[], settings: any): Dictionary<boolean> =>
  _reduce(schemas||[], (d, s) => ({ ...d, [s._id]: isUserChanged(settings[s._id], s)}), {});
