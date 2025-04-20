import { AfterViewInit, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { containsCaseInsensitive, Sudoku } from '@olmi/model';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, skip, takeUntil } from 'rxjs';
import { cloneDeep as _clone, get as _get, set as _set, sortBy as _sortBy } from 'lodash';
import { AppUserOptions, DestroyComponentBase, SUDOKU_STORE } from '@olmi/common';

class FilterSortOptions {
  constructor(o?: Partial<FilterSortOptions>) {
    this.text = '';
    this.sortBy = 'difficulty';
    this.sortMode = 'desc';
    this.hideTrySchemas = true;
    Object.assign(<any>this, o || {});
  }

  text?: string;
  difficulty?: string;
  sortBy?: 'name'|'difficulty'|'numbers';
  sortMode?: 'asc'|'desc';
  hideTrySchemas?: boolean;
}

@Component({
  selector: 'schemas-toolbar',
  imports: [
    CommonModule,
    FlexModule,
    MatFormField,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './schemas-toolbar.component.html',
  styleUrl: './schemas-toolbar.component.scss',
  standalone: true
})
export class SchemasToolbarComponent extends DestroyComponentBase implements AfterViewInit {
  readonly store = inject(SUDOKU_STORE);

  playing$: BehaviorSubject<boolean>;
  algorithms$: BehaviorSubject<string[]>;
  options$: BehaviorSubject<FilterSortOptions>;
  filtered$: BehaviorSubject<number>;
  total$: Observable<number>;

  sortByItems = [
    { text: 'Name', value: 'name' },
    { text: 'Difficulty', value: 'difficulty' },
    { text: 'Fixed Numbers', value: 'numbers' }
  ]

  @Input()
  set onlyPlaying(p: boolean|null|undefined) {
    this.playing$.next(!!p);
  }

  @Input()
  set algorithms(a: string[]|null|undefined) {
    this.algorithms$.next(a||[]);
  }

  @Input()
  persistenceKey: string|undefined|null;

  @Output()
  onFilter: EventEmitter<Sudoku[]> = new EventEmitter<Sudoku[]>();

  constructor() {
    super();
    this.options$ = new BehaviorSubject<FilterSortOptions>(new FilterSortOptions());
    this.playing$ = new BehaviorSubject<boolean>(false);
    this.algorithms$ = new BehaviorSubject<string[]>([]);

    this.total$ = this.store.catalog$.pipe(map(ctg => ctg?.length||0));
    this.filtered$ = new BehaviorSubject<number>(0);

    combineLatest([this.store.catalog$, this.options$, this.playing$, this.algorithms$]).pipe(
      debounceTime(100),
      map(([catalog, o, play, algs]: [Sudoku[], FilterSortOptions, boolean, string[]]) => {
        const res = catalog.filter(s =>
          checkName(o, s) &&
          checkSchema(o, s) &&
          checkDifficulty(o, s) &&
          checkTry(o, s) &&
          checkPlaying(play, s) &&
          checkAlgorithms(algs, s))
        const sorted = _sortBy(res, sdk => sortByField(o, sdk));
        if (o.sortMode === 'desc') sorted.reverse();
        return sorted;
      }))
      .subscribe(sdks => {
        this.filtered$.next(sdks.length);
        this.onFilter.emit(sdks);
      });
  }

  private _persist(o: FilterSortOptions) {
    if (!this.persistenceKey) return;
    AppUserOptions.updateFeature(`filter_options_${this.persistenceKey}`, o);
  }

  private _loadOptions() {
    if (this.persistenceKey) {
      const po = AppUserOptions.getFeatures(`filter_options_${this.persistenceKey}`, new FilterSortOptions());
      this.options$.next(new FilterSortOptions(po));
      this.options$
        .pipe(skip(1), takeUntil(this._destroy$))
        .subscribe(o => this._persist(o));
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this._loadOptions());
  }

  updateOptions(v: any, target: keyof FilterSortOptions, source?: string) {
    const o = _clone(this.options$.value);
    v = source ? _get(v, source) : v;
    _set(o, target, v);
    this.options$.next(o);
  }
}


const isSchemaTest = (text?: string) => /^\d+$/g.test(text||'');

const checkSchema = (o: FilterSortOptions, s: Sudoku): boolean => {
  const st = `${o.text||''}`.toLowerCase().trim();
  return !isSchemaTest(st) || s.values.startsWith(st);
}

const checkName = (o: FilterSortOptions, s: Sudoku): boolean => {
  const st = `${o.text||''}`.toLowerCase().trim();
  return !st || isSchemaTest(o.text) || `${s.name||''}`.includes(st);
}

const checkDifficulty = (o: FilterSortOptions, s: Sudoku): boolean => {
  return !o.difficulty || containsCaseInsensitive(s.info.difficulty, o.difficulty);
}

const checkTry = (o: FilterSortOptions, s: Sudoku): boolean => {
  return !o.hideTrySchemas || !s.info.useTryAlgorithm;
}

const checkPlaying = (playing: boolean, sdk: Sudoku): boolean => {
  return !playing || !!AppUserOptions.getUserValues(sdk._id);
}

const checkAlgorithms = (algs: string[], sdk: Sudoku): boolean => {
  return algs.length<1 || !algs.find(a => !sdk.info.difficultyMap[a]);
}

const sortByField = (o: FilterSortOptions, sdk: Sudoku): any => {
  switch (o.sortBy) {
    case 'difficulty': return sdk.info.difficultyValue;
    case 'numbers': return sdk.info.fixedCount;
    case 'name':
    default: return sdk.name;
  }
}
