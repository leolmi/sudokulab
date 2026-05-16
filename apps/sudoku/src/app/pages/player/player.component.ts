import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardComponent, BoardManager, PLAYER_BOARD_USER_OPTIONS_FEATURE } from '@olmi/board';
import { Location, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StepViewerComponent, StepViewerItem } from '@olmi/step-viewer';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { calcStatusForMenu } from './player.menu';
import { PLAYER_PAGE_ROUTE } from './player.manifest';
import { PageBase } from '../../model/page.base';
import { defaultHandleMenuItem, downloadSchema, getStatLines, StatLine } from '../pages.helper';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './player.logic';
import {
  AlgorithmResult,
  checkStatus,
  hasErrors,
  LocalContext,
  MenuItem,
  NotificationType,
  SDK_PREFIX,
  Sudoku,
} from '@olmi/model';
import { cloneDeep as _clone } from 'lodash';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { SchemasDialogComponent } from '@olmi/schemas-browser';
import { SchemaHeaderComponent } from '@olmi/schema-header';
import {
  SchemaKeeperDialogComponent,
  SchemaKeeperErrorAction,
  SchemaKeeperErrorDialogComponent,
} from '@olmi/schema-keeper';
import { AppUserOptions, I18nDirective } from '@olmi/common';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { SolveToDialogComponent } from '@olmi/solve-to-dialog';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';
import { HighlightsEditorComponent } from '@olmi/highlights-editor';
import { PlayAction, PlayPanelComponent } from '@olmi/play-panel';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';


const PLAYER_VISIBLE_STAT: any = {
  rankStr: 'Rank',
  fixedCount: true,
  missingCount: true,
  userCount: true,
  percent: true,
};

@Component({
  imports: [
    NgClass,
    ClipboardModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressBar,
    MatTabsModule,
    BoardComponent,
    StepViewerComponent,
    SchemaHeaderComponent,
    SchemaToolbarComponent,
    HighlightsEditorComponent,
    PlayPanelComponent,
    I18nDirective,
  ],
  selector: 'sudoku-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true,
  providers: [BoardManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerComponent extends PageBase {
  private readonly _location = inject(Location);
  private readonly _clipboard = inject(Clipboard);
  private readonly _route = inject(ActivatedRoute);

  readonly logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
  readonly toolbarTemplate = 'nums,clear,pencil';

  readonly manager = inject(BoardManager);

  // viste signal-derived dei segnali del manager
  readonly sudoku = computed<Sudoku>(() => this.manager.sudoku());
  readonly sequence = computed<AlgorithmResult[]>(() => this.manager.sequence());
  readonly hasSequence = computed<boolean>(() => this.sequence().length > 0);
  readonly stat = computed<StatLine[]>(() =>
    getStatLines(this.manager.stat(), { visible: PLAYER_VISIBLE_STAT }));
  readonly isComplete = computed<boolean>(() => {
    const s = this.manager.stat();
    return s.hasErrors || s.percent >= 100;
  });
  readonly isEmpty = computed<boolean>(() => this.manager.stat().isEmpty);

  readonly layout = computed<string>(() => this.state.layout().narrow ? 'column' : 'row');

  // indice del tab attivo nella banda destra (wide) / sotto-board (narrow).
  // 0 = "Let's play", 1 = "Step viewer". Auto-passa a 1 quando la sequence
  // si popola; torna a 0 quando si svuota (e il tab step-viewer scompare).
  readonly selectedTabIndex = signal<number>(0);

  /** 81 celle dell'overlay cascata — delay già pronto in ms per `[style.animation-delay]`. */
  readonly fxCells = Array.from({ length: 81 }, (_, i) => {
    const r = Math.floor(i / 9);
    const c = i % 9;
    return { r, c, i, delay: (r + c) * 30 };
  });
  /** true durante il play dell'effetto "schema completato". Toggled via RAF per restart pulito. */
  readonly fxPlaying = signal<boolean>(false);

  private readonly _game = signal<string>('');

  constructor() {
    super();
    this.manager.usePersistence = true;

    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    if (LocalContext.isLevel('debug'))
      console.log(...SDK_PREFIX, 'init game to last storage value >', o.game || '');
    this._game.set(o.game || '');

    // opzioni iniziali (one-shot)
    this.manager.options(
      AppUserOptions.getFeatures(PLAYER_BOARD_USER_OPTIONS_FEATURE, {
        isCoord: true,
        isAvailable: true,
        isNotify: true,
        isPasteEnabled: true,
      }), {
        editMode: 'play',
        isDynamic: false,
      });

    this._route.params
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(p => {
        const sid = (<any>p)?.id || '';
        if (sid && this._game() !== sid) {
          if (LocalContext.isLevel('debug'))
            console.log(...SDK_PREFIX, 'set game to url value >', sid);
          this._game.set(sid);
        }
      });

    // imposta lo schema-of-the-day se non c'è game corrente e il catalogo è pronto
    effect(() => {
      const filled = this.store.isFilled();
      const game = this._game();
      const sotd = this.store.schemaOfTheDay();
      if (filled && !game && !!sotd) {
        if (LocalContext.isLevel('debug'))
          console.log(...SDK_PREFIX, 'set game to schema-of-the-day >', sotd);
        this._game.set(sotd);
      }
    });

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, this.manager,
        (it) => this._handlePrivateItems(it));

    // apre lo schema scelto quando catalogo pronto + game definito.
    // `getSudoku()` viene letto in `untracked()`: legge `_catalog()` ma non
    // vogliamo che l'effect dipenda da `_catalog`, perché `_openSchema()`
    // scrive `_catalog` (via `getSudokuEx().solve() + _catalog.set(...)`),
    // creando un loop di re-run dell'effect (e doppia chiamata a
    // `manager.load()` → doppio worker `check`).
    effect(() => {
      const filled = this.store.isFilled();
      const game = this._game();
      if (!filled || !game) return;
      const sdk = untracked(() => this.store.getSudoku(game));
      if (sdk) {
        if (LocalContext.isLevel('debug'))
          console.log(...SDK_PREFIX, 'apre lo schema > ', sdk._id);
        untracked(() => this._openSchema(sdk));
      } else {
        console.warn(SDK_PREFIX, `game not found "${game}"`);
      }
    });

    // persistenza delle opzioni utente al variare dello status
    effect(() => {
      const s = this.manager.status();
      AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, s);
    });

    // auto-select del tab "Step viewer" sul popolamento della sequence.
    // Tracciamo solo le transizioni len-zero ↔ len-non-zero per non
    // sovrascrivere la scelta dell'utente quando la sequence resta non vuota.
    let prevHasSeq = false;
    effect(() => {
      const hasSeq = this.hasSequence();
      if (hasSeq && !prevHasSeq) {
        untracked(() => this.selectedTabIndex.set(1));
      } else if (!hasSeq && prevHasSeq) {
        untracked(() => this.selectedTabIndex.set(0));
      }
      prevHasSeq = hasSeq;
    });

    // FX "schema completato": solo sulla transizione incompleto→completo, senza errori.
    // - lo stato iniziale (`isEmpty`) viene scartato, così uno schema caricato già
    //   completo non scatena l'effetto.
    // - `stat.hasErrors` non è affidabile qui: `handleBoardValue` aggiorna cells in
    //   modo SINCRONO senza passare dal check errori (che è a carico del
    //   logic-worker, asincrono), quindi la prima emissione di stat dopo l'ultima
    //   cifra può avere `hasErrors=false` anche se il valore è errato.
    //   Riverifichiamo esplicitamente con `checkStatus` prima di partire.
    let prevComplete: boolean | null = null;
    effect(() => {
      const stat = this.manager.stat();
      if (stat.isEmpty) {
        prevComplete = null;
        return;
      }
      const currComplete = stat.isComplete;
      if (prevComplete === false && currComplete) {
        untracked(() => {
          const cells = _clone(this.manager.cells());
          checkStatus(cells);
          if (!hasErrors(cells)) this._playCompletionFx();
        });
      }
      prevComplete = currComplete;
    });

    // aggiorna lo stato del menu in base allo schema corrente.
    // `calcStatusForMenu` legge `tr.lang()` via `t`: lasciamo la chiamata in tracked
    // così il menu si rigenera al cambio lingua; solo `updateStatus` resta in untracked.
    effect(() => {
      const sdk = this.manager.sudoku();
      const s = this.manager.status();
      const stat = this.manager.stat();
      const filled = this.store.isFilled();
      const status = calcStatusForMenu(sdk, s, stat, filled, this.t);
      untracked(() => this.state.updateStatus(status));
    });
  }

  private _handlePrivateItems(item: MenuItem) {
    switch (item.property) {
      case 'browse': {
        const sudoku = this.store.getSudoku(this._game());
        this.openDialog<Sudoku>(SchemasDialogComponent, (sdk) =>
          this._game.set(sdk.values), { data: { sudoku }, autoFocus: false });
        break;
      }
      case 'solve-to': {
        const schema = this.store.getSudoku(this._game());
        this.openDialog<string>(SolveToDialogComponent, (step) =>
          this.manager.goToStep(step), { data: { schema } });
        break;
      }
      case 'keeper': {
        this.openDialog<string>(SchemaKeeperDialogComponent, (values) =>
          this._checkValues(values));
        break;
      }
      case 'clear-highlights': {
        this.manager.setHighlights();
        break;
      }
      case 'random': {
        const sdk = this.store.getRandomSchema();
        this._openSchema(sdk);
        break;
      }
      case 'download': {
        const sdk = this.store.getSudoku(this._game());
        console.log(...SDK_PREFIX, 'downloaded schema', sdk);
        if (sdk?.values) this._clipboard.copy(sdk.values);
        downloadSchema(sdk);
        break;
      }
      case 'check': {
        const sdk = this.store.getSudoku(this._game());
        if (sdk) this.store.checkSchema(sdk);
        break;
      }
    }
  }

  private _openSchema(sdk?: Sudoku, goToStep?: number) {
    if (!sdk) return;
    this.store
      .getSudokuEx(sdk.values)
      .then(sdkx => {
        if (sdkx) {
          this.manager.load(<Sudoku>sdkx);
          const name = sdkx.values;
          const route = `/${PLAYER_PAGE_ROUTE}/${name}`;
          this.state.updateRoute(route);
          AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, { game: name });
          checkPlayerUrl(this._location, this._router, route);
          // goToStep applicato dopo load: il worker accoda solve-to dopo il check.
          if (goToStep && goToStep > 0) this.manager.goToStep(String(goToStep));
        }
      });
  }

  /**
   * Handler delle azioni emesse dal play-panel.
   * - `random`: schema casuale dal catalogo.
   * - `hard`: schema casuale tra i 30 più difficili (esclusi quelli che usano TryNumber).
   * - `with-algorithm`: schema casuale che utilizza l'algoritmo scelto, portato
   *   fino allo step immediatamente precedente al suo primo utilizzo.
   *
   * Se lo schema attivo ha modifiche utente (valori o available custom), prima
   * chiede conferma — così l'utente non perde inavvertitamente lo stato corrente.
   */
  onPlayAction(action: PlayAction) {
    this._askIfDirty(() => {
      switch (action.kind) {
        case 'random': {
          const sdk = this.store.getRandomSchema();
          this._openSchema(sdk);
          break;
        }
        case 'hard': {
          const sdk = pickHardSchema(this.store.catalog());
          this._openSchema(sdk);
          break;
        }
        case 'with-algorithm': {
          const picked = pickSchemaForAlgorithm(this.store.catalog(), action.algorithmId);
          if (!picked) {
            this.notifier.notify(this.t('No schema found for this algorithm'), NotificationType.warning);
            return;
          }
          this._openSchema(picked.sdk, picked.preStep);
          break;
        }
      }
    });
  }

  /**
   * `dirty` = lo schema attivo ha almeno un inserimento utente — sia esso
   * un valore (`stat.userCount`) o un override degli available (`userValues.cv`).
   * Schema vuoto (nessun fisso) viene considerato non-dirty.
   */
  private _isCurrentSchemaDirty(): boolean {
    const stat = this.manager.stat();
    if (stat.isEmpty) return false;
    if (stat.userCount > 0) return true;
    const cv = stat.userValues?.cv || {};
    return Object.keys(cv).length > 0;
  }

  private _askIfDirty(then: () => void) {
    if (!this._isCurrentSchemaDirty()) {
      then();
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Open a new schema?',
      message: 'The current schema has unsaved progress. Open a new schema anyway?',
    };
    this.openDialog<boolean>(ConfirmDialogComponent, () => then(), { data });
  }

  private _playCompletionFx() {
    // restart pulito: togli la classe play, poi riaggiungi al frame successivo.
    this.fxPlaying.set(false);
    requestAnimationFrame(() => {
      this.fxPlaying.set(true);
      // toast di conferma (MatSnackBar già usato in app)
      this.notifier.notify(this.t('Schema completed!'), NotificationType.success, { duration: 2600 });
      // cascata ~1.1s + bordo ~1.1s: spegni il flag a fine animazione
      setTimeout(() => this.fxPlaying.set(false), 1400);
    });
  }

  private _checkValues(values: string) {
    this.store.checkSchema(new Sudoku({ values }))
      .then(sdkx => this._game.set(sdkx?.values || ''))
      .catch(err => this._handleSchemaError(values, err));
  }

  private _handleSchemaError(values: string, error: any) {
    this._dialog
      .open(SchemaKeeperErrorDialogComponent, { data: { values, error } })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((action: SchemaKeeperErrorAction | undefined) => {
        switch (action) {
          case 'edit':
            // riapre il keeper con i valori problematici pre-caricati in modalità schema
            this.openDialog<string>(SchemaKeeperDialogComponent,
              (v) => this._checkValues(v),
              { data: { values } });
            break;
          case 'download':
            this._clipboard.copy(values);
            this.notifier.notify(this.t('Schema string copied to clipboard'));
            break;
          case 'close':
          default:
            break;
        }
      });
  }

  pasteSchema(values: string) {
    this._checkValues(values);
  }

  openHighlights(item: StepViewerItem) {
    if (item?.highlights) this.manager.setHighlights(item.highlights);
    if (item?.cell) this.manager.select(item.cell);
  }
}

const checkPlayerUrl = (location: Location, router: Router, route: string) => {
  if (!router.url.startsWith(route)) location.go(route);
}

const HARD_POOL_SIZE = 30;

/**
 * Sceglie a caso uno schema tra i `HARD_POOL_SIZE` più difficili che NON
 * usano l'algoritmo TryNumber. Se nessuno schema ha la metadata necessaria
 * ricade su un random globale.
 */
const pickHardSchema = (catalog: Sudoku[]): Sudoku | undefined => {
  if (!catalog?.length) return undefined;
  const pool = catalog
    .filter(s => s?.info && !s.info.useTryAlgorithm && (s.info.difficultyValue || 0) > 0)
    .sort((a, b) => (b.info?.difficultyValue || 0) - (a.info?.difficultyValue || 0))
    .slice(0, HARD_POOL_SIZE);
  if (!pool.length) return catalog[Math.floor(Math.random() * catalog.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Sceglie a caso uno schema che impiega l'algoritmo indicato (controllando
 * `info.difficultyMap`) e ritorna anche il numero di step da risolvere
 * automaticamente — cioè l'indice del primo utilizzo dell'algoritmo —
 * così da fermarsi al passo immediatamente precedente.
 */
const pickSchemaForAlgorithm = (
  catalog: Sudoku[],
  algorithmId: string,
): { sdk: Sudoku; preStep: number } | undefined => {
  if (!catalog?.length || !algorithmId) return undefined;
  const candidates: { sdk: Sudoku; firstAt: number }[] = [];
  for (const s of catalog) {
    const map = s?.info?.difficultyMap || {};
    const positions = map[algorithmId];
    if (positions && positions.length > 0) {
      candidates.push({ sdk: s, firstAt: positions[0] });
    }
  }
  if (!candidates.length) return undefined;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { sdk: pick.sdk, preStep: pick.firstAt };
}
