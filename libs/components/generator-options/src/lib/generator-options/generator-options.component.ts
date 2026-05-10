import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlgorithmsSelectorDialogComponent } from '../algorithms-selector-dialog/algorithms-selector-dialog.component';
import {
  Algorithm,
  EndGenerationMode,
  GENERATOR_MAX_NUMBERS,
  GENERATOR_MAX_VARIANTS,
  GENERATOR_MAX_WORKERS,
  GENERATOR_MIN_NUMBERS,
  GENERATOR_MIN_VARIANTS,
  GENERATOR_MIN_WORKERS,
  GeneratorOptions,
  getFixedCount,
  getTypedValue,
  SudokuCell,
  TRY_NUMBER_ALGORITHM,
  ValueType,
} from '@olmi/model';
import { get as _get, set as _set } from 'lodash';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  AVAILABLE_DIFFICULTIES,
  AVAILABLE_STOP_MODES,
  AVAILABLE_SYMMETRIES,
  AVAILABLE_VALUES_MODES,
  getUsableAlgorithms,
  hasNewOrDynamicFixed,
  isMultischema,
} from './generator-options.helper';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { getAlgorithms } from '@olmi/algorithms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MultiLogicManager, SudokuState } from '@olmi/common';
import { BoardManager } from '@olmi/board';

@Component({
  selector: 'generator-options',
  imports: [
    FormsModule,
    MatDialogModule,
    MatOption,
    MatInput,
    MatFormField,
    MatIconModule,
    MatLabel,
    MatSelect,
    MatSlider,
    MatSliderThumb,
    MatCheckbox,
  ],
  templateUrl: './generator-options.component.html',
  styleUrl: './generator-options.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorOptionsComponent {
  readonly AVAILABLE_DIFFICULTIES = AVAILABLE_DIFFICULTIES;
  readonly AVAILABLE_SYMMETRIES = AVAILABLE_SYMMETRIES;
  readonly AVAILABLE_STOP_MODES = AVAILABLE_STOP_MODES;
  readonly AVAILABLE_VALUES_MODES = AVAILABLE_VALUES_MODES;
  readonly GENERATOR_MAX_NUMBERS = GENERATOR_MAX_NUMBERS;
  readonly GENERATOR_MIN_NUMBERS = GENERATOR_MIN_NUMBERS;
  readonly GENERATOR_MAX_WORKERS = GENERATOR_MAX_WORKERS;
  readonly GENERATOR_MIN_WORKERS = GENERATOR_MIN_WORKERS;
  readonly GENERATOR_MAX_VARIANTS = GENERATOR_MAX_VARIANTS;
  readonly GENERATOR_MIN_VARIANTS = GENERATOR_MIN_VARIANTS;
  readonly TRY_NUMBER_ALGORITHM = TRY_NUMBER_ALGORITHM;
  readonly EndGenerationMode = EndGenerationMode;
  readonly algorithms: Algorithm[] = getAlgorithms();

  private readonly _manager = inject(BoardManager);

  readonly options = input<GeneratorOptions | null | undefined>(new GeneratorOptions());

  readonly onOptionsChanged = output<GeneratorOptions>();

  // valore effettivo (mai null) usato in template e logica interna
  readonly opt = computed<GeneratorOptions>(() => this.options() || new GeneratorOptions());

  readonly disabled = SudokuState.isRunning;
  readonly workersLengthChanged = computed<boolean>(() =>
    (this.opt().workersLength || GENERATOR_MIN_WORKERS) !== MultiLogicManager.count);

  readonly algorithmsSummary = computed<string>(() => this._buildSummary(this.opt()));

  // celle correnti del manager (signal-derived)
  private readonly _cells = computed<SudokuCell[]>(() => this._manager.cells());

  readonly isMultischema = computed<boolean>(() => isMultischema(this._cells(), this.opt()));
  readonly hasNewOrDynamicFixed = computed<boolean>(() => hasNewOrDynamicFixed(this._cells(), this.opt()));
  readonly fixedCount = computed<number>(() => getFixedCount(this._cells()));

  private readonly _dialog = inject(MatDialog);

  private _buildSummary(opt: GeneratorOptions): string {
    const usable = getUsableAlgorithms(this.algorithms, opt.allowTryAlgorithm);
    const usableIds = new Set(usable.map(a => a.id));
    const selected = (opt.useAlgorithms || []).filter(id => usableIds.has(id));
    if (selected.length === 0 || selected.length === usable.length) {
      return 'All algorithms';
    }
    return selected
      .map(id => this.algorithms.find(a => a.id === id)?.name || id)
      .join(', ');
  }

  openAlgorithmsDialog() {
    if (SudokuState.isRunning()) return;
    const opt = this.opt();
    const usable = getUsableAlgorithms(this.algorithms, opt.allowTryAlgorithm);
    this._dialog
      .open(AlgorithmsSelectorDialogComponent, {
        data: { algorithms: usable, selected: opt.useAlgorithms || [] },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result: string[] | undefined) => {
        if (Array.isArray(result)) this.updateOptions('useAlgorithms', result);
      });
  }

  updateOptions(path: string, v: any, type?: ValueType, sourcePath?: string) {
    const o = { ...this.opt() };
    if (sourcePath) v = _get(v, sourcePath);
    const value = getTypedValue(v, type);
    _set(o, path, value);
    this.onOptionsChanged.emit(o);
  }
}
