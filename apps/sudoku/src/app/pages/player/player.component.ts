import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardComponent, BoardManager, PLAYER_BOARD_USER_OPTIONS_FEATURE } from '@olmi/board';
import { Location, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, pairwise, Subscription } from 'rxjs';
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
import { AppUserOptions } from '@olmi/common';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { SolveToDialogComponent } from '@olmi/solve-to-dialog';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';
import { HighlightsEditorComponent } from '@olmi/highlights-editor';


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
    BoardComponent,
    StepViewerComponent,
    SchemaHeaderComponent,
    SchemaToolbarComponent,
    HighlightsEditorComponent,
  ],
  selector: 'sudoku-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerComponent extends PageBase {
  private readonly _location = inject(Location);
  private readonly _clipboard = inject(Clipboard);
  private readonly _route = inject(ActivatedRoute);

  readonly logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
  readonly toolbarTemplate = 'nums,clear,pencil';

  readonly manager = signal<BoardManager | undefined>(undefined);

  // signal locali alimentati dai BehaviorSubject del manager (vedi effect in
  // constructor); restano in attesa che la Fase 4 migri il BoardManager.
  readonly sudoku = signal<Sudoku | undefined>(undefined);
  readonly sequence = signal<AlgorithmResult[]>([]);
  readonly stat = signal<StatLine[]>([]);
  readonly isComplete = signal<boolean>(false);
  readonly isEmpty = signal<boolean>(true);
  readonly isCoord = signal<boolean>(false);

  readonly layout = computed<string>(() => this.state.layout().narrow ? 'column' : 'row');

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
    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    if (LocalContext.isLevel('debug'))
      console.log(...SDK_PREFIX, 'init game to last storage value >', o.game || '');
    this._game.set(o.game || '');

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
      defaultHandleMenuItem(this._router, this.state, item, this.manager(),
        (it) => this._handlePrivateItems(it));

    // apre lo schema scelto quando catalogo pronto + game definito + manager
    // pronto. La dipendenza esplicita su `manager()` è necessaria al ritorno
    // sulla page: `isFilled` è già `true` e `_game` viene riletto da
    // localStorage prima ancora che il `BoardComponent` istanzi il manager,
    // quindi senza questa dipendenza `_openSchema` partirebbe quando
    // `manager()` è ancora `undefined` (no-op).
    //
    // `getSudoku()` viene letto in `untracked()`: legge `_catalog()` ma non
    // vogliamo che l'effect dipenda da `_catalog`, perché `_openSchema()`
    // scrive `_catalog` (via `getSudokuEx().solve() + _catalog.set(...)`),
    // creando un loop di re-run dell'effect (e doppia chiamata a
    // `manager.load()` → doppio worker `check`).
    effect(() => {
      const filled = this.store.isFilled();
      const game = this._game();
      const manager = this.manager();
      if (!filled || !game || !manager) return;
      const sdk = untracked(() => this.store.getSudoku(game));
      if (sdk) {
        if (LocalContext.isLevel('debug'))
          console.log(...SDK_PREFIX, 'apre lo schema > ', sdk._id);
        untracked(() => this._openSchema(sdk));
      } else {
        console.warn(SDK_PREFIX, `game not found "${game}"`);
      }
    });

    // orchestrazione delle subscription al manager: il BoardManager è ancora
    // basato su BehaviorSubject (verrà migrato in Fase 4); le subscription
    // sono ricreate ad ogni cambio di reference del manager.
    effect(onCleanup => {
      const manager = this.manager();
      if (!manager) return;

      // assegna le opzioni iniziali una volta sola, alla prima ready
      manager.options(
        AppUserOptions.getFeatures(PLAYER_BOARD_USER_OPTIONS_FEATURE, {
          isCoord: true,
          isAvailable: true,
          isNotify: true,
          isPasteEnabled: true,
        }), {
          editMode: 'play',
          isDynamic: false,
        });

      const subs = new Subscription();

      subs.add(manager.sudoku$.subscribe(sdk => this.sudoku.set(sdk)));
      subs.add(manager.sequence$.subscribe(seq => this.sequence.set(seq || [])));
      subs.add(manager.status$.subscribe(s => this.isCoord.set(!!s.isCoord)));
      subs.add(manager.stat$.subscribe(stat => {
        this.isEmpty.set(stat.isEmpty);
        this.isComplete.set(stat.hasErrors || stat.percent >= 100);
        this.stat.set(getStatLines(stat, { visible: PLAYER_VISIBLE_STAT }));
      }));
      // salva le impostazioni utente al variare delle opzioni
      subs.add(manager.status$.subscribe(s => AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, s)));

      // FX "schema completato": solo sulla transizione incompleto→completo, senza errori.
      // - filter(!isEmpty) scarta lo stato iniziale del BehaviorSubject, così il
      //   pairwise non scatta su uno schema caricato già completo (rimane orfano
      //   di "prev incompleto").
      // - `stat.hasErrors` non è affidabile qui: `handleBoardValue` aggiorna
      //   cells$ in modo SINCRONO senza passare dal check errori (che è a carico
      //   del logic-worker, asincrono), quindi la prima emissione di stat$ dopo
      //   l'ultima cifra può avere `hasErrors=false` anche se il valore è errato.
      //   Riverifichiamo esplicitamente con `checkStatus` prima di partire.
      subs.add(manager.stat$.pipe(
        filter(s => !s.isEmpty),
        pairwise(),
        filter(([prev, curr]) => !prev.isComplete && curr.isComplete),
      ).subscribe(() => {
        const cells = _clone(manager.cells$.value);
        checkStatus(cells);
        if (!hasErrors(cells)) this._playCompletionFx();
      }));

      onCleanup(() => subs.unsubscribe());
    });

    // aggiorna lo stato del menu in base allo schema corrente
    effect(onCleanup => {
      const manager = this.manager();
      if (!manager) return;
      const sub = manager.sudoku$.subscribe(sdk => {
        const s = manager.status$.value;
        const stat = manager.stat$.value;
        const filled = this.store.isFilled();
        this.state.updateStatus(calcStatusForMenu(sdk, s, stat, filled));
      });
      const sub2 = manager.status$.subscribe(s => {
        const sdk = manager.sudoku$.value;
        const stat = manager.stat$.value;
        const filled = this.store.isFilled();
        this.state.updateStatus(calcStatusForMenu(sdk, s, stat, filled));
      });
      const sub3 = manager.stat$.subscribe(stat => {
        const sdk = manager.sudoku$.value;
        const s = manager.status$.value;
        const filled = this.store.isFilled();
        this.state.updateStatus(calcStatusForMenu(sdk, s, stat, filled));
      });
      onCleanup(() => { sub.unsubscribe(); sub2.unsubscribe(); sub3.unsubscribe(); });
    });
  }

  private _handlePrivateItems(item: MenuItem) {
    const manager = this.manager();
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
          manager?.goToStep(step), { data: { schema } });
        break;
      }
      case 'keeper': {
        this.openDialog<string>(SchemaKeeperDialogComponent, (values) =>
          this._checkValues(values));
        break;
      }
      case 'clear-highlights': {
        manager?.setHighlights();
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

  private _openSchema(sdk?: Sudoku) {
    if (!sdk) return;
    this.store
      .getSudokuEx(sdk.values)
      .then(sdkx => {
        if (sdkx) {
          this.manager()?.load(<Sudoku>sdkx);
          const name = sdkx.values;
          const route = `/${PLAYER_PAGE_ROUTE}/${name}`;
          this.state.updateRoute(route);
          AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, { game: name });
          checkPlayerUrl(this._location, this._router, route);
        }
      });
  }

  private _playCompletionFx() {
    // restart pulito: togli la classe play, poi riaggiungi al frame successivo.
    this.fxPlaying.set(false);
    requestAnimationFrame(() => {
      this.fxPlaying.set(true);
      // toast di conferma (MatSnackBar già usato in app)
      this.notifier.notify('Schema completato!', NotificationType.success, { duration: 2600 });
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
            this.notifier.notify('Stringa schema copiata negli appunti');
            break;
          case 'close':
          default:
            break;
        }
      });
  }

  ready(manager: BoardManager) {
    if (!this.manager()) {
      manager.usePersistence = true;
      this.manager.set(manager);
    }
  }

  pasteSchema(values: string) {
    this._checkValues(values);
  }

  openHighlights(item: StepViewerItem) {
    const manager = this.manager();
    if (item?.highlights) manager?.setHighlights(item.highlights);
    if (item?.cell) manager?.select(item.cell);
  }
}

const checkPlayerUrl = (location: Location, router: Router, route: string) => {
  if (!router.url.startsWith(route)) location.go(route);
}
