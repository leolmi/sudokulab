import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {
  DIFFICULTY_RANGES,
  EditSudoku,
  EditSudokuEndGenerationMode,
  EditSudokuOptions,
  EditSudokuValorizationMode,
  GeneratorFacade,
  getMaxNumbers,
  getMinNumbers,
  hasEndGenerationValue,
  hasXValues,
  isMutation,
  SudokuFacade,
  SudokulabSettingsService,
  SudokuSymmetry,
  update
} from '@sudokulab/model';
import {debounceTime, map, skip, takeUntil} from 'rxjs/operators';
import {has as _has, keys as _keys} from 'lodash';
import {GeneratorBaseComponent} from '../GeneratorBaseComponent';
import {ItemInfo} from '../../model';

@Component({
  selector: 'sudokulab-generator-options',
  templateUrl: './generator-options.component.html',
  styleUrls: ['./generator-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorOptionsComponent extends GeneratorBaseComponent implements OnDestroy {
  minNumbers$: Observable<number>;
  maxNumbers$: Observable<number>;
  isStopModeCount$: Observable<boolean>;
  hasXValues$: Observable<boolean>;
  availableDimensions: ItemInfo[];
  availableSymmetries: ItemInfo[];
  availableDifficulty: ItemInfo[];
  availableStopModes: ItemInfo[];
  availableValorizationModes: ItemInfo[];

  symmetry$: BehaviorSubject<SudokuSymmetry>;
  valorizationMode$: BehaviorSubject<EditSudokuValorizationMode>;
  fixedCount$: BehaviorSubject<number>;
  minDiff$: BehaviorSubject<number>;
  maxDiff$: BehaviorSubject<number>;
  excludeTryAlgorithm$: BehaviorSubject<boolean>;
  generationEndMode$: BehaviorSubject<EditSudokuEndGenerationMode>
  generationEndValue$: BehaviorSubject<number>;
  maxSplitSchema$: BehaviorSubject<number>;
  maxSchemaCycles$: BehaviorSubject<number>;
  editSudoku$: Observable<EditSudoku|undefined>;

  constructor(private _generator: GeneratorFacade,
              private _settings: SudokulabSettingsService,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);

    this.editSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.isStopModeCount$ = this.editSudoku$.pipe(map(es => hasEndGenerationValue(es?.options)));
    this.minNumbers$ = this.editSudoku$.pipe(map(es => getMinNumbers(es?.options?.rank)));
    this.maxNumbers$ = this.editSudoku$.pipe(map(es => getMaxNumbers(es?.options?.rank)));
    this.hasXValues$ = this.editSudoku$.pipe(map(es => hasXValues(es)));

    this.symmetry$ = _settings.generate<SudokuSymmetry>('generator.symmetry', SudokuSymmetry.diagonalNESW);
    this.valorizationMode$ = _settings.generate<EditSudokuValorizationMode>('generator.valorizationMode', EditSudokuValorizationMode.sequential);
    this.fixedCount$ = _settings.generate<number>('generator.fixedValues', 24);
    this.minDiff$ = _settings.generate<number>('generator.minDiff', 0);
    this.maxDiff$ = _settings.generate<number>('generator.maxDiff', 1000000);
    this.excludeTryAlgorithm$ = _settings.generate<boolean>('generator.excludeTryAlgorithm', true);
    this.generationEndMode$ = _settings.generate<EditSudokuEndGenerationMode>('generator.generationEndMode', EditSudokuEndGenerationMode.afterN);
    this.generationEndValue$ = _settings.generate<number>('generator.generationEndValue', 1);
    this.maxSplitSchema$ = _settings.generate<number>('generator.maxSplitSchema', 50);
    this.maxSchemaCycles$ = _settings.generate<number>('generator.maxSchemaCycles', 500);

    this.availableDimensions = [{
      code: 4,
      description: '4x4'
    }, {
      code: 9,
      description: '9x9'
    }, {
      code: 16,
      description: '16x16'
    }];
    this.availableSymmetries = _keys(SudokuSymmetry).map(ss => ({
      description: ss,
      code: ss
    }));
    this.availableDifficulty = [{
      code: undefined,
      description: 'undefined'
    }, ...(DIFFICULTY_RANGES.map(r => ({
      description: r.label.toLowerCase(),
      code: r.value
    })))];
    this.availableStopModes = [{
      code: EditSudokuEndGenerationMode.manual,
      description: 'manual'
    }, {
      code: EditSudokuEndGenerationMode.afterN,
      description: 'after N schemas'
    }, {
      code: EditSudokuEndGenerationMode.afterTime,
      description: 'after N seconds'
    }];
    this.availableValorizationModes = [{
      code: EditSudokuValorizationMode.sequential,
      description: 'sequential'
    }, {
      code: EditSudokuValorizationMode.random,
      description: 'random'
    }];

    combineLatest(
      ...[
        this.editSudoku$,
        this.symmetry$,
        this.valorizationMode$,
        this.fixedCount$,
        this.minDiff$,
        this.maxDiff$,
        this.excludeTryAlgorithm$,
        this.generationEndMode$,
        this.generationEndValue$,
        this.maxSplitSchema$,
        this.maxSchemaCycles$])
      .pipe(takeUntil(this._destroy$), skip(1), debounceTime(200))
      .subscribe(([sdk,
                    symmetry,
                    valorizationMode,
                    fixedCount,
                    minDiff,
                    maxDiff,
                    excludeTryAlgorithm,
                    generationEndMode,
                    generationEndValue,
                    maxSplitSchema,
                    maxSchemaCycles]) => {
        const o = new EditSudokuOptions(sdk?.options);
        const no = {
          symmetry,
          valorizationMode,
          fixedCount,
          minDiff,
          maxDiff,
          excludeTryAlgorithm,
          generationEndMode,
          generationEndValue,
          maxSplitSchema,
          maxSchemaCycles
        };
        if (!isMutation(o, no)) return;
        this._generator.updateGeneratorOptions(update(o, no));
      });
  }

  private _getValue(e: any) {
    let value = e;
    if (_has(e, 'checked')) value = e.checked;
    if (e?.target) {
      const input = (<HTMLInputElement>e?.target);
      value = input.value;
    }
    return value;
  }

  applySettings(e: any, target$: BehaviorSubject<any>) {
    const value = this._getValue(e);
    target$.next(value);
  }

  apply(e: any, target: string) {
    let value = e;
    if (_has(e, 'checked')) value = e.checked;
    if (e?.target) {
      const input = (<HTMLInputElement>e?.target);
      value = input.value;
    }
    // use(this.options$, o => this._generator.updateGeneratorOptions(update(o, {[target]: value})));
  }
}
