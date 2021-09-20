import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DIFFICULTY_RANGES,
  EditSudoku,
  EditSudokuEndGenerationMode,
  EditSudokuOptions,
  GeneratorFacade,
  getMaxNumbers,
  getMinNumbers,
  hasEndGenerationValue,
  SudokuSymmetry, update, use
} from '@sudokulab/model';
import { map, takeUntil } from 'rxjs/operators';
import { keys as _keys, has as _has } from 'lodash';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';

interface ItemInfo {
  code: any;
  description: string;
}

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
  availableDimensions: ItemInfo[];
  availableSymmetries: ItemInfo[];
  availableDifficulty: ItemInfo[];
  availableStopModes: ItemInfo[];

  editSudoku$: Observable<EditSudoku|undefined>;
  options$: Observable<EditSudokuOptions>;

  constructor(private _generator: GeneratorFacade) {
    super(_generator);

    this.editSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.options$ = this.editSudoku$.pipe(map(es => es?.options||new EditSudokuOptions()));
    this.isStopModeCount$ = this.options$.pipe(map(o => hasEndGenerationValue(o)));
    this.minNumbers$ = this.editSudoku$.pipe(map(es => getMinNumbers(es?.options?.rank)));
    this.maxNumbers$ = this.editSudoku$.pipe(map(es => getMaxNumbers(es?.options?.rank)));

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
  }

  apply(e: any, target: string) {
    let value = e;
    if (_has(e, 'checked')) value = e.checked;
    if (e?.target) {
      const input = (<HTMLInputElement>e?.target);
      value = input.value;
    }
    use(this.options$, o => this._generator.updateGeneratorOptions(update(o, {[target]: value})));
  }
}
