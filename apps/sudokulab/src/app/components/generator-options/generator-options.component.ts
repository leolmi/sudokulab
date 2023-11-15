import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {Observable} from 'rxjs';
import {
  DIFFICULTY_RANGES,
  EditSudokuEndGenerationMode,
  EditSudokuValorizationMode,
  GENERATOR_DATA,
  GeneratorData,
  GeneratorMode,
  GeneratorStatus, getFixedCount,
  getGeneratorStatus,
  getMaxNumbers, getMaxValCycles,
  getMinNumbers, getValuesCount,
  hasEndGenerationValue,
  hasXValues,
  SUDOKU_DEFAULT_RANK,
  SudokuSymmetry
} from '@sudokulab/model';
import {map} from 'rxjs/operators';
import {has as _has, keys as _keys} from 'lodash';
import {ItemInfo} from '../../model';

@Component({
  selector: 'sudokulab-generator-options',
  templateUrl: './generator-options.component.html',
  styleUrls: ['./generator-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorOptionsComponent {
  minNumbers$: Observable<number>;
  maxNumbers$: Observable<number>;
  isStopModeCount$: Observable<boolean>;
  hasXValues$: Observable<boolean>;
  availableDimensions: ItemInfo[];
  availableSymmetries: ItemInfo[];
  availableDifficulty: ItemInfo[];
  availableStopModes: ItemInfo[];
  availableValorizationModes: ItemInfo[];
  stopModeCountLabel$: Observable<string>;
  fixedCount$: Observable<number>;
  maxValCycles$: Observable<number>;

  status$: Observable<GeneratorStatus>;
  MODE = GeneratorMode;
  RANK = SUDOKU_DEFAULT_RANK;

  constructor(@Inject(GENERATOR_DATA) public generator: GeneratorData) {
    this.status$ = generator.sdk$.pipe(map((sdk) => getGeneratorStatus(sdk)));
    this.isStopModeCount$ = generator.sdk$.pipe(map(ps => hasEndGenerationValue(ps?.options)));
    this.stopModeCountLabel$ = generator.sdk$.pipe(map(ps =>
       ps?.options.generator.generationEndMode === EditSudokuEndGenerationMode.afterTime ? 'Seconds' : 'Builded schemas'));
    this.minNumbers$ = generator.sdk$.pipe(map(ps => getMinNumbers(ps?.sudoku?.rank)));
    this.maxNumbers$ = generator.sdk$.pipe(map(ps => getMaxNumbers(ps?.sudoku?.rank)));
    this.hasXValues$ = generator.sdk$.pipe(map(ps => hasXValues(ps)));
    this.fixedCount$ = generator.sdk$.pipe(map(ps => getValuesCount(ps)));
    this.maxValCycles$ = generator.sdk$.pipe(map(ps => getMaxValCycles(ps)));

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

  applyOption(e: any, target: string) {
    const value = this._getValue(e);
    //use(this.options$, o => this._gen.updateGeneratorOptions(update(o, {[target]: value})));
    if (this.generator.manager) this.generator.manager.updateGeneratorOptions({[target]: value});
  }

  applySudoku(e: any, target: string) {
    // not implemented
  }
}
