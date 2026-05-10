import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { PageBase } from '../../model/page.base';
import {
  BoardComponent,
  BoardManager,
  BoardStatus,
  GENERATOR_BOARD_USER_OPTIONS_FEATURE,
} from '@olmi/board';
import { calcStatusForMenu } from './generator.menu';
import { defaultHandleMenuItem, getStatLines, StatLine } from '../pages.helper';
import { SUDOKU_PAGE_GENERATOR_LOGIC } from './generator.logic';
import { GeneratorOptionsComponent } from '@olmi/generator-options';
import { GeneratorOptions, NotificationType, Sudoku, SudokuStat } from '@olmi/model';
import { MatProgressBar } from '@angular/material/progress-bar';
import { GeneratorSchemasComponent } from '@olmi/generator-schemas';
import {
  AppUserOptions,
  GENERATOR_OPTIONS_FEATURE,
  SudokuState,
} from '@olmi/common';
import { omit as _omit } from 'lodash';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';


const GENERATOR_VISIBLE_STAT: any = {
  fixedCount: true,
  dynamicCount: true,
  fixedAndDynamicCount: true,
};

@Component({
  imports: [
    NgClass,
    BoardComponent,
    GeneratorOptionsComponent,
    GeneratorSchemasComponent,
    MatProgressBar,
    SchemaToolbarComponent,
  ],
  selector: 'sudoku-generator',
  templateUrl: './generator.component.html',
  styleUrl: './generator.component.scss',
  standalone: true,
  providers: [BoardManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorComponent extends PageBase {
  readonly logic = inject(SUDOKU_PAGE_GENERATOR_LOGIC);
  readonly toolbarTemplate = 'nums,clear,play';
  readonly globalState = SudokuState;

  readonly manager = inject(BoardManager);
  readonly options = signal<GeneratorOptions>(
    AppUserOptions.getFeatures(GENERATOR_OPTIONS_FEATURE, new GeneratorOptions()));

  // viste signal-derived dei segnali del manager
  readonly stat = computed<SudokuStat>(() => this.manager.stat());
  readonly lines = computed<StatLine[]>(() =>
    getStatLines(this.stat(), { visible: GENERATOR_VISIBLE_STAT }));
  readonly valuesToAdd = computed<string>(() => getValuesToAdd(this.stat(), this.options()));

  readonly layout = computed<string>(() => this.state.layout().narrow ? 'column' : 'row');

  constructor() {
    super();

    // opzioni iniziali (one-shot)
    const uo = AppUserOptions.getFeatures(GENERATOR_BOARD_USER_OPTIONS_FEATURE, <Partial<BoardStatus>>{
      isCoord: true,
      isAvailable: true,
      editMode: 'schema',
      isDynamic: true,
      isPasteEnabled: true,
    });
    this.manager.options(uo, {
      editMode: 'schema',
      isDynamic: true,
    });
    if ((<any>uo).schema) this.manager.load((<any>uo).schema);

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, this.manager);

    // persiste le opzioni utente sul localStorage (skip primo valore = caricato)
    let firstSeen = false;
    effect(() => {
      const o = this.options();
      if (!firstSeen) { firstSeen = true; return; }
      AppUserOptions.updateFeature(GENERATOR_OPTIONS_FEATURE, o);
    });

    // persistenza schema corrente al variare delle stat
    effect(() => {
      this.manager.stat();
      untracked(() => {
        const schema = this.manager.getSchema({ allowDynamic: true });
        AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, { schema });
      });
    });

    // status → persistenza utente (omettendo schema, già gestito sopra)
    effect(() => {
      const sts = this.manager.status();
      AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, _omit(sts, ['schema']));
    });

    // aggiorna lo stato del menu in base a manager + isRunning + isStopping + options
    effect(() => {
      const o = this.options();
      const running = SudokuState.isRunning();
      const sts = this.manager.status();
      const stopping = this.manager.isStopping();
      const stat = this.manager.stat();
      untracked(() =>
        this.state.updateStatus(calcStatusForMenu(running, stopping, isMultiSchema(o, stat), sts.isLock)));
    });

    // propaga le opzioni al manager
    effect(() => this.manager.updateGeneratorOptions(this.options()));
  }

  updateOptions(o: GeneratorOptions) {
    this.options.set(o);
  }

  pasteSchema(values: string) {
    this.manager.load(values);
    this.notifier.notify('Schema pasted from clipboard successfully', NotificationType.success);
  }

  clickOnGeneratedSchema(sdk: Sudoku) {
    console.log(sdk.values);
  }
}

const getValuesToAdd = (stat: SudokuStat, o: GeneratorOptions) => {
  const vta = o.fixedCount - stat.fixedAndDynamicCount;
  if (vta <= 0) return 'none';
  return (vta > o.fixedCount) ? `${o.fixedCount}` : `${vta}`;
}

const isMultiSchema = (o: GeneratorOptions, stat: SudokuStat) => {
  return o.fixedCount > stat.fixedAndDynamicCount;
}
