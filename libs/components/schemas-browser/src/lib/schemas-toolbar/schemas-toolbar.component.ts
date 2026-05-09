import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { containsCaseInsensitive, Sudoku } from '@olmi/model';
import { cloneDeep as _clone, get as _get, set as _set, sortBy as _sortBy } from 'lodash';
import { AppUserOptions, SUDOKU_STORE } from '@olmi/common';

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
  sortBy?: 'name' | 'difficulty' | 'numbers';
  sortMode?: 'asc' | 'desc';
  hideTrySchemas?: boolean;
}

@Component({
  selector: 'schemas-toolbar',
  imports: [
    MatFormField,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './schemas-toolbar.component.html',
  styleUrl: './schemas-toolbar.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemasToolbarComponent implements AfterViewInit {
  readonly store = inject(SUDOKU_STORE);

  readonly onlyPlaying = input<boolean | null | undefined>(false);
  readonly algorithms = input<string[] | null | undefined>([]);
  readonly persistenceKey = input<string | undefined | null>(undefined);

  readonly onFilter = output<Sudoku[]>();

  readonly options = signal<FilterSortOptions>(new FilterSortOptions());
  readonly filtered = signal<number>(0);
  readonly total = computed<number>(() => (this.store.catalog() || []).length);

  readonly sortByItems = [
    { text: 'Name', value: 'name' },
    { text: 'Difficulty', value: 'difficulty' },
    { text: 'Fixed Numbers', value: 'numbers' },
  ];

  private _filterTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // calcolo del filtro debounced (100ms): ricalcola la lista filtrata e
    // ordinata al variare di catalog/options/playing/algorithms; sostituisce
    // il `combineLatest(...).pipe(debounceTime(100))` legacy.
    effect(() => {
      const catalog = this.store.catalog() || [];
      const o = this.options();
      const play = !!this.onlyPlaying();
      const algs = this.algorithms() || [];
      if (this._filterTimer) clearTimeout(this._filterTimer);
      this._filterTimer = setTimeout(() => {
        this._filterTimer = null;
        const res = catalog.filter(s =>
          checkName(o, s) &&
          checkSchema(o, s) &&
          checkDifficulty(o, s) &&
          checkTry(o, s) &&
          checkPlaying(play, s) &&
          checkAlgorithms(algs, s));
        const sorted = _sortBy(res, sdk => sortByField(o, sdk));
        if (o.sortMode === 'desc') sorted.reverse();
        this.filtered.set(sorted.length);
        this.onFilter.emit(sorted);
      }, 100);
    });
  }

  private _persist(o: FilterSortOptions) {
    const key = this.persistenceKey();
    if (!key) return;
    AppUserOptions.updateFeature(`filter_options_${key}`, o);
  }

  private _loadOptions() {
    const key = this.persistenceKey();
    if (!key) return;
    const po = AppUserOptions.getFeatures(`filter_options_${key}`, new FilterSortOptions());
    this.options.set(new FilterSortOptions(po));
    // persist successivi cambi (skip primo set caricato dal localStorage)
    let firstSeen = false;
    effect(() => {
      const o = this.options();
      if (!firstSeen) { firstSeen = true; return; }
      this._persist(o);
    }, { injector: this._injectorForOptions });
  }

  // injector salvato per usare `effect()` da `_loadOptions` (chiamato fuori
  // dal constructor in `ngAfterViewInit`)
  private readonly _injectorForOptions = inject(Injector);

  ngAfterViewInit() {
    setTimeout(() => this._loadOptions());
  }

  updateOptions(v: any, target: keyof FilterSortOptions, source?: string) {
    const o = _clone(this.options());
    v = source ? _get(v, source) : v;
    _set(o, target, v);
    this.options.set(o);
  }
}


const isSchemaTest = (text?: string) => /^\d+$/g.test(text || '');

const checkSchema = (o: FilterSortOptions, s: Sudoku): boolean => {
  const st = `${o.text || ''}`.toLowerCase().trim();
  return !isSchemaTest(st) || s.values.startsWith(st);
}

const checkName = (o: FilterSortOptions, s: Sudoku): boolean => {
  const st = `${o.text || ''}`.toLowerCase().trim();
  return !st || isSchemaTest(o.text) || `${s.name || ''}`.includes(st);
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
  return algs.length < 1 || !algs.find(a => !sdk.info.difficultyMap[a]);
}

const sortByField = (o: FilterSortOptions, sdk: Sudoku): any => {
  switch (o.sortBy) {
    case 'difficulty': return sdk.info.difficultyValue;
    case 'numbers': return sdk.info.fixedCount;
    case 'name':
    default: return sdk.name;
  }
}
