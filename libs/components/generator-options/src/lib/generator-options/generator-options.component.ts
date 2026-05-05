import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ValueType
} from '@olmi/model';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { get as _get, set as _set } from 'lodash';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  AVAILABLE_DIFFICULTIES,
  AVAILABLE_STOP_MODES,
  AVAILABLE_SYMMETRIES,
  AVAILABLE_VALUES_MODES,
  getUsableAlgorithms,
  hasNewOrDynamicFixed,
  isMultischema
} from './generator-options.helper';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { getAlgorithms } from '@olmi/algorithms';
import { MatCheckbox } from '@angular/material/checkbox';
import { ManagerComponentBase, MultiLogicManager, SudokuState } from '@olmi/common';
import { BoardManager } from '@olmi/board';

@Component({
  selector: 'generator-options',
  imports: [
    CommonModule,
    FlexLayoutModule,
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
    MatCheckbox
  ],
  templateUrl: './generator-options.component.html',
  styleUrl: './generator-options.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorOptionsComponent extends ManagerComponentBase<BoardManager> implements OnInit {
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
  readonly algorithms: Algorithm[];

  options$: BehaviorSubject<GeneratorOptions>;
  algorithmsSummary$: Observable<string>;

  disabled$: Observable<boolean> = of(true);
  isMultischema$: Observable<boolean> = of(false);
  hasNewOrDynamicFixed$: Observable<boolean> = of(false);
  fixedCount$: Observable<number> = of(0);
  workersLengthChanged$: Observable<boolean>;

  private readonly _dialog = inject(MatDialog);

  @Input()
  set options(o: GeneratorOptions | null | undefined) {
    this.options$.next(o || new GeneratorOptions());
  }

  @Output()
  onOptionsChanged: EventEmitter<GeneratorOptions> = new EventEmitter<GeneratorOptions>();

  constructor() {
    super();

    this.options$ = new BehaviorSubject<GeneratorOptions>(new GeneratorOptions());
    this.algorithms = getAlgorithms();

    this.algorithmsSummary$ = this.options$.pipe(map(o => this._buildSummary(o)));

    this.workersLengthChanged$ = this.options$.pipe(map(o =>
      (o.workersLength||GENERATOR_MIN_WORKERS) !== MultiLogicManager.count));
  }

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
    if (SudokuState.isRunning$.value) return;
    const opt = this.options$.value;
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

  ngOnInit() {
    if (this.manager) {
      this.disabled$ = SudokuState.isRunning$.pipe(map(r => r));
      this.isMultischema$ = combineLatest([this.manager.cells$, this.options$]).pipe(
        map(([cells, options]: [SudokuCell[], GeneratorOptions]) => isMultischema(cells, options)));
      this.hasNewOrDynamicFixed$ = combineLatest([this.manager.cells$, this.options$]).pipe(
        map(([cells, options]: [SudokuCell[], GeneratorOptions]) => hasNewOrDynamicFixed(cells, options)));
      this.fixedCount$ = this.manager.cells$.pipe(map(cells => getFixedCount(cells)));
    }
  }

  updateOptions(path: string, v: any, type?: ValueType, sourcePath?: string) {
    const o = { ...this.options$.value };
    if (sourcePath) v = _get(v, sourcePath);
    const value = getTypedValue(v, type);
    _set(o, path, value);
    this.onOptionsChanged.emit(o);
  }

}
