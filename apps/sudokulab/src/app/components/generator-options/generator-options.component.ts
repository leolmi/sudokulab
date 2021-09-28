import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
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
  SudokuFacade,
  SudokuSymmetry,
  update,
  use
} from '@sudokulab/model';
import { map, takeUntil } from 'rxjs/operators';
import { has as _has, keys as _keys } from 'lodash';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';
import { ItemInfo } from '../../model';

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
  options$: Observable<EditSudokuOptions>;
  editSudoku$: Observable<EditSudoku|undefined>;

  constructor(private _generator: GeneratorFacade,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);

    this.editSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.isStopModeCount$ = this.editSudoku$.pipe(map(es => hasEndGenerationValue(es?.options)));
    this.minNumbers$ = this.editSudoku$.pipe(map(es => getMinNumbers(es?.options?.rank)));
    this.maxNumbers$ = this.editSudoku$.pipe(map(es => getMaxNumbers(es?.options?.rank)));
    this.hasXValues$ = this.editSudoku$.pipe(map(es => hasXValues(es)));
    this.options$ = this.editSudoku$.pipe(map(es => es?.options||new EditSudokuOptions()));

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

  apply(e: any, target: string) {
    const value = this._getValue(e);
    use(this.options$, o => this._generator.updateGeneratorOptions(update(o, {[target]: value})));
  }
}
