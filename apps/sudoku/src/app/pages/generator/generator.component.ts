import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import {
  BoardComponent,
  BoardManager,
  BoardStatus,
  GENERATOR_BOARD_USER_OPTIONS_FEATURE,
  GENERATOR_OPTIONS_FEATURE
} from '@olmi/board';
import { MAIN } from './generator.menu';
import { calcMenuStatus, defaultHandleMenuItem, getStatLines, StatLine } from '../pages.helper';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, of, skip, takeUntil } from 'rxjs';
import { SUDOKU_PAGE_GENERATOR_LOGIC } from './generator.logic';
import { GeneratorOptionsComponent } from '@olmi/generator-options';
import { GeneratorOptions, Sudoku, SudokuStat } from '@olmi/model';
import { MatProgressBar } from '@angular/material/progress-bar';
import { GeneratorSchemasComponent } from '@olmi/generator-schemas';
import { AppUserOptions } from '@olmi/common';
import { omit as _omit } from 'lodash';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';


const GENERATOR_VISIBLE_STAT: any = {
  fixedCount: true,
  dynamicCount: true,
  fixedAndDynamicCount: true,
}

@Component({
  imports: [
    CommonModule,
    FlexLayoutModule,
    BoardComponent,
    GeneratorOptionsComponent,
    GeneratorSchemasComponent,
    MatProgressBar,
    SchemaToolbarComponent
  ],
  selector: 'sudoku-generator',
  templateUrl: './generator.component.html',
  styleUrl: './generator.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends PageBase {
  logic = inject(SUDOKU_PAGE_GENERATOR_LOGIC);
  toolbarTemplate = 'nums,clear,play';

  manager: BoardManager | undefined;
  lines$: Observable<StatLine[]> = of([]);
  valuesToAdd$: Observable<string> = of('none');
  options$: BehaviorSubject<GeneratorOptions>;
  layout$: Observable<string>;

  constructor() {
    super();
    const o = AppUserOptions.getFeatures(GENERATOR_OPTIONS_FEATURE, new GeneratorOptions());
    this.options$ = new BehaviorSubject<GeneratorOptions>(o);

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, this.manager);

    this.options$.pipe(
      takeUntil(this._destroy$),
      skip(1))
      .subscribe(o =>
        AppUserOptions.updateFeature(GENERATOR_OPTIONS_FEATURE, o));

    this.layout$ = this.state.layout$.pipe(map(l => l.narrow ? 'column' : 'row'));
  }

  private _init() {

    const uo = AppUserOptions.getFeatures(GENERATOR_BOARD_USER_OPTIONS_FEATURE, <Partial<BoardStatus>>{
      isCoord: true,
      isAvailable: true,
      editMode: 'schema',
      isDynamic: true,
      isPasteEnabled: true
    });

    // assegna le opzioni iniziali
    this.manager?.options(uo);
    if ((<any>uo).schema) this.manager?.load((<any>uo).schema);

    if (this.manager) {
      this.lines$ = this.manager.stat$.pipe(map(s => getStatLines(s, { visible: GENERATOR_VISIBLE_STAT })));
      // aggiorna lo stato del menu e salva le impostazioni utente al variare delle opzioni
      combineLatest([this.manager.status$, this.manager.isRunning$, this.manager.isStopping$, this.options$, this.manager.stat$])
        .subscribe(([sts, running, stopping, o, stat]: [BoardStatus, boolean, boolean, GeneratorOptions, SudokuStat]) => {
          this.state.updateStatus(calcMenuStatus(MAIN, { ...sts,
            build: !running && isMultiSchema(o, stat),
            stop: running && !stopping,
            generate: !running && !stopping,
            skip: running && !stopping && isMultiSchema(o, stat)
          }));
          AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, _omit(sts, ['schema']));
        });

      this.options$.subscribe(o => this.manager?.updateGeneratorOptions(o));

      // aggiorna lo stato dello schema e salva lo schema attivo
      this.manager.stat$.subscribe(s => {
        const schema = this.manager?.getSchema({ allowDynamic: true });
        AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, { schema });
      });

      this.valuesToAdd$ = combineLatest([this.manager.stat$, this.options$])
        .pipe(map(([stat, o]: [SudokuStat, GeneratorOptions]) => getValuesToAdd(stat, o)));
    }
  }

  ready(manager: BoardManager) {
    if (!this.manager) {
      this.manager = manager;
      this._init();
    }
  }

  updateOptions(o: GeneratorOptions) {
    this.options$.next(o);
  }

  pasteSchema(values: string) {
    this.manager?.load(values);
  }

  clickOnGeneratedSchema(sdk: Sudoku) {
    console.log(sdk.values);
  }
}

const getValuesToAdd = (stat: SudokuStat, o: GeneratorOptions) => {
  const vta = o.fixedCount - stat.fixedAndDynamicCount
  if (vta <= 0) return 'none';
  return (vta > o.fixedCount) ? `${o.fixedCount}` : `${vta}`;
}

const getGenerationInfo = (data: any): string => {
  return JSON.stringify(data, null, 2);
}

const isMultiSchema = (o: GeneratorOptions, stat: SudokuStat) => {
  return o.fixedCount > stat.fixedAndDynamicCount;
}
