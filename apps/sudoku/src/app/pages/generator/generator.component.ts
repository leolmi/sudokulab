import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { skip, Subscription } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorComponent extends PageBase {
  readonly logic = inject(SUDOKU_PAGE_GENERATOR_LOGIC);
  readonly toolbarTemplate = 'nums,clear,play';
  readonly globalState = SudokuState;

  readonly manager = signal<BoardManager | undefined>(undefined);
  readonly options = signal<GeneratorOptions>(
    AppUserOptions.getFeatures(GENERATOR_OPTIONS_FEATURE, new GeneratorOptions()));

  // signal locali alimentati dai BehaviorSubject del manager (Fase 4)
  readonly stat = signal<SudokuStat | undefined>(undefined);
  readonly lines = signal<StatLine[]>([]);
  readonly valuesToAdd = computed<string>(() => {
    const stat = this.stat();
    const o = this.options();
    if (!stat) return 'none';
    return getValuesToAdd(stat, o);
  });

  readonly layout = computed<string>(() => this.state.layout().narrow ? 'column' : 'row');

  constructor() {
    super();

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, this.manager());

    // persiste le opzioni utente sul localStorage (skip primo valore = caricato)
    let firstSeen = false;
    effect(() => {
      const o = this.options();
      if (!firstSeen) { firstSeen = true; return; }
      AppUserOptions.updateFeature(GENERATOR_OPTIONS_FEATURE, o);
    });

    // orchestrazione delle subscription al manager: il BoardManager è ancora
    // basato su BehaviorSubject (verrà migrato in Fase 4); le subscription
    // sono ricreate ad ogni cambio di reference del manager.
    effect(onCleanup => {
      const manager = this.manager();
      if (!manager) return;

      const uo = AppUserOptions.getFeatures(GENERATOR_BOARD_USER_OPTIONS_FEATURE, <Partial<BoardStatus>>{
        isCoord: true,
        isAvailable: true,
        editMode: 'schema',
        isDynamic: true,
        isPasteEnabled: true,
      });

      // assegna le opzioni iniziali una volta sola
      manager.options(uo, {
        editMode: 'schema',
        isDynamic: true,
      });
      if ((<any>uo).schema) manager.load((<any>uo).schema);

      const subs = new Subscription();

      // statistiche → signal
      subs.add(manager.stat$.subscribe(s => {
        this.stat.set(s);
        this.lines.set(getStatLines(s, { visible: GENERATOR_VISIBLE_STAT }));
        // salva lo schema attivo
        const schema = manager.getSchema({ allowDynamic: true });
        AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, { schema });
      }));

      // status → persistenza utente (omettendo schema, già gestito sopra)
      subs.add(manager.status$.subscribe(sts =>
        AppUserOptions.updateFeature(GENERATOR_BOARD_USER_OPTIONS_FEATURE, _omit(sts, ['schema']))));

      onCleanup(() => subs.unsubscribe());
    });

    // aggiorna lo stato del menu in base a manager + isRunning + isStopping + options
    effect(onCleanup => {
      const manager = this.manager();
      const o = this.options();
      const running = SudokuState.isRunning();
      if (!manager) return;
      const update = () => {
        const sts = manager.status$.value;
        const stopping = manager.isStopping$.value;
        const stat = manager.stat$.value;
        this.state.updateStatus(calcStatusForMenu(running, stopping, isMultiSchema(o, stat), sts.isLock));
      };
      update();
      const subs = new Subscription();
      subs.add(manager.status$.subscribe(() => update()));
      subs.add(manager.isStopping$.subscribe(() => update()));
      subs.add(manager.stat$.subscribe(() => update()));
      onCleanup(() => subs.unsubscribe());
    });

    // propaga le opzioni al manager
    effect(() => {
      const manager = this.manager();
      const o = this.options();
      manager?.updateGeneratorOptions(o);
    });
  }

  ready(manager: BoardManager) {
    if (!this.manager()) this.manager.set(manager);
  }

  readyGen(m: BoardManager) {
    m?.options({
      isDisabled: true,
      editMode: 'schema',
      isCoord: true,
      isDynamic: true,
    });
  }

  updateOptions(o: GeneratorOptions) {
    this.options.set(o);
  }

  pasteSchema(values: string) {
    this.manager()?.load(values);
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
