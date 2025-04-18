import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Algorithm,
  EndGenerationMode,
  GENERATOR_MAX_NUMBERS,
  GENERATOR_MIN_NUMBERS,
  GeneratorOptions,
  getFixedCount,
  getTypedValue,
  SudokuCell,
  TRY_NUMBER_ALGORITHM,
  ValueType
} from '@olmi/model';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { get as _get, remove as _remove, set as _set } from 'lodash';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  AVAILABLE_DIFFICULTIES,
  AVAILABLE_STOP_MODES,
  AVAILABLE_SYMMETRIES,
  AVAILABLE_VALUES_MODES,
  getAlgorithmsMap,
  isMultischema,
  hasNewOrDynamicFixed
} from './generator-options.helper';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { getAlgorithms } from '@olmi/algorithms';
import { MatCheckbox } from '@angular/material/checkbox';
import { ManagerComponentBase } from '@olmi/common';

@Component({
  selector: 'generator-options',
  imports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
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
export class GeneratorOptionsComponent extends ManagerComponentBase implements OnInit {
  readonly AVAILABLE_DIFFICULTIES = AVAILABLE_DIFFICULTIES;
  readonly AVAILABLE_SYMMETRIES = AVAILABLE_SYMMETRIES;
  readonly AVAILABLE_STOP_MODES = AVAILABLE_STOP_MODES;
  readonly AVAILABLE_VALUES_MODES = AVAILABLE_VALUES_MODES;
  readonly GENERATOR_MAX_NUMBERS = GENERATOR_MAX_NUMBERS;
  readonly GENERATOR_MIN_NUMBERS = GENERATOR_MIN_NUMBERS;
  readonly EndGenerationMode = EndGenerationMode;
  readonly algorithms: Algorithm[];

  options$: BehaviorSubject<GeneratorOptions>;
  algMap$: BehaviorSubject<any>;

  disabled$: Observable<boolean> = of(true);
  isMultischema$: Observable<boolean> = of(false);
  hasNewOrDynamicFixed$: Observable<boolean> = of(false);
  fixedCount$: Observable<number> = of(0);

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
    this.algMap$ = new BehaviorSubject<any>({});

    this.options$.subscribe(o =>
      this.algMap$.next(getAlgorithmsMap(this.algorithms, o.useAlgorithms)));
  }

  ngOnInit() {
    if (this.manager) {
      this.disabled$ = this.manager.isRunning$.pipe(map(r => r));
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

  updateAlgMap(alg: Algorithm, checked: boolean) {
    const as = [...this.options$.value.useAlgorithms || []];
    if (checked) {
      if (!as.includes(alg.id)) as.push(alg.id)
    } else {
      if (as.includes(alg.id)) _remove(as, s => s === alg.id);
    }
    this.updateOptions('useAlgorithms', as);
  }

  protected readonly TRY_NUMBER_ALGORITHM = TRY_NUMBER_ALGORITHM;
}
