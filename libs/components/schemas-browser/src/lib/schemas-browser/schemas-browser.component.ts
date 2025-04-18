import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { containsCaseInsensitive, Sudoku } from '@olmi/model';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  Observable,
  shareReplay,
  skip, Subject,
  take,
  takeUntil
} from 'rxjs';
import { cloneDeep as _clone, findIndex, get as _get, set as _set, sortBy as _sortBy } from 'lodash';
import { BoardPreviewComponent } from '@olmi/board';
import { CdkFixedSizeVirtualScroll, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FlexModule } from '@angular/flex-layout';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatOptionModule } from '@angular/material/core';
import { AppUserOptions, SUDOKU_STATE, SUDOKU_STORE } from '@olmi/common';
import { ItemTooltipPipe, UserPlayingPipe } from './pipes';

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
  selector: 'schemas-browser',
  imports: [
    CommonModule,
    FlexModule,
    BoardPreviewComponent,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    MatFormField,
    MatOptionModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    ItemTooltipPipe,
    UserPlayingPipe
  ],
  templateUrl: './schemas-browser.component.html',
  styleUrl: './schemas-browser.component.scss',
  standalone: true
})
export class SchemasBrowserComponent implements OnDestroy, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport|undefined;
  private readonly _destroy$: Subject<void>;
  private _element: ElementRef;

  readonly state = inject(SUDOKU_STATE)
  readonly store = inject(SUDOKU_STORE);
  options$: BehaviorSubject<FilterSortOptions>;
  schemas$: Observable<Sudoku[]>;
  activeSchema$: BehaviorSubject<string>;
  skipScrollTo$: BehaviorSubject<boolean>;
  playing$: BehaviorSubject<boolean>;
  algorithms$: BehaviorSubject<string[]>;

  total$: Observable<number>;
  filtered$: Observable<number>;

  sortByItems = [
    { text: 'Name', value: 'name' },
    { text: 'Difficulty', value: 'difficulty' },
    { text: 'Fixed Numbers', value: 'numbers' }
  ]

  @Input()
  set activeSchema(s: string|null|undefined) {
    if (this.activeSchema$.value !== s) {
      this.activeSchema$.next(s||'');
      setTimeout(() => this.scrollToActive(), 150);
    }
  }

  @Input()
  persistenceKey: string|undefined|null;

  @Input()
  allowCompact = false;

  @Input()
  set onlyPlaying(p: boolean|null|undefined) {
    this.playing$.next(!!p);
  }

  @Input()
  set algorithms(a: string[]|null|undefined) {
    this.algorithms$.next(a||[]);
  }

  @Output()
  clickOnSchema: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  constructor() {
    this._element = inject(ElementRef);
    this._destroy$ = new Subject<void>();
    this.options$ = new BehaviorSubject<FilterSortOptions>(new FilterSortOptions());
    this.activeSchema$ = new BehaviorSubject<string>('');
    this.skipScrollTo$ = new BehaviorSubject<boolean>(false);
    this.playing$ = new BehaviorSubject<boolean>(false);
    this.algorithms$ = new BehaviorSubject<string[]>([]);

    this.total$ = this.store.catalog$.pipe(map(ctg => ctg?.length||0));

    this.schemas$ = combineLatest([this.store.catalog$, this.options$, this.playing$, this.algorithms$]).pipe(
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
      }),
      shareReplay(1));

    this.filtered$ = this.schemas$.pipe(map(scs => scs?.length||0));
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

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  ngAfterViewInit() {
    setTimeout(() => this._loadOptions());
  }

  internalClickOnSchema(sdk: Sudoku) {
    this.skipScrollTo$.next(true)
    this.clickOnSchema.emit(sdk);
  }

  updateOptions(v: any, target: keyof FilterSortOptions, source?: string) {
    const o = _clone(this.options$.value);
    v = source ? _get(v, source) : v;
    _set(o, target, v);
    this.options$.next(o);
  }

  scrollToActive() {
    combineLatest([this.schemas$, this.activeSchema$, this.skipScrollTo$])
      .pipe(take(1))
      .subscribe(([schemas, active, skip]: [Sudoku[], string, boolean]) => {
        if (!skip) {
          const activeIndex = findIndex(schemas, s => s.values === active);
          if (activeIndex > -1) this.viewPort?.scrollToIndex(activeIndex);
        } else {
          this.skipScrollTo$.next(false);
        }
    });
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

