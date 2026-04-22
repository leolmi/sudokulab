import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardComponent, BoardManager, PLAYER_BOARD_USER_OPTIONS_FEATURE } from '@olmi/board';
import { CommonModule, Location } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  pairwise,
  takeUntil,
  withLatestFrom
} from 'rxjs';
import { StepViewerComponent, StepViewerItem } from '@olmi/step-viewer';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { calcStatusForMenu } from './player.menu';
import { PLAYER_PAGE_ROUTE } from './player.manifest';
import { PageBase } from '../../model/page.base';
import { defaultHandleMenuItem, downloadSchema, getStatLines, StatLine } from '../pages.helper';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './player.logic';
import { checkStatus, hasErrors, LocalContext, MenuItem, NotificationType, SDK_PREFIX, Sudoku } from '@olmi/model';
import { cloneDeep as _clone } from 'lodash';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { SchemasDialogComponent } from '@olmi/schemas-browser';
import { SchemaHeaderComponent } from '@olmi/schema-header';
import { SchemaKeeperDialogComponent, SchemaKeeperErrorAction, SchemaKeeperErrorDialogComponent } from '@olmi/schema-keeper';
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
}

@Component({
  imports: [
    CommonModule,
    ClipboardModule,
    FlexLayoutModule,
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
    HighlightsEditorComponent
  ],
  selector: 'sudoku-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent extends PageBase {

  private readonly _game$: BehaviorSubject<string>;
  private readonly _location = inject(Location);
  private readonly _clipboard = inject(Clipboard);

  logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
  toolbarTemplate = 'nums,clear,pencil';

  manager: BoardManager | undefined;
  stat$: Observable<StatLine[]> = of([]);
  isComplete$: Observable<boolean> = of(false);
  isEmpty$: Observable<boolean> = of(true);
  isCoord$: Observable<boolean> = of(false);
  layout$: Observable<string>;

  /** 81 celle dell'overlay cascata — delay già pronto in ms per `[style.animation-delay]`. */
  readonly fxCells = Array.from({ length: 81 }, (_, i) => {
    const r = Math.floor(i / 9);
    const c = i % 9;
    return { r, c, i, delay: (r + c) * 30 };
  });
  /** true durante il play dell'effetto "schema completato". Toggled via RAF per restart pulito. */
  readonly fxPlaying$ = new BehaviorSubject<boolean>(false);

  private get game() {
    return this._game$.value;
  }

  constructor() {
    super();
    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    if (LocalContext.isLevel('debug'))
      console.log(...SDK_PREFIX, 'init game to last storage value >', o.game||'');
    this._game$ = new BehaviorSubject<string>(o.game||'');

    const route = inject(ActivatedRoute);
    route.params.subscribe(p => {
      const sid = (<any>p)?.id || '';
      if (sid && this._game$.value !== sid) {
        if (LocalContext.isLevel('debug'))
          console.log(...SDK_PREFIX, 'set game to url value >', sid)
        this._game$.next(sid);
      }
    });

    this.store.isFilled$.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged(),
      withLatestFrom(this._game$, this.store.schemaOfTheDay$))
      .subscribe(([filled, game, sotd]: [boolean, string, string]) => {
        if (filled && !game && !!sotd) {
          if (LocalContext.isLevel('debug'))
            console.log(...SDK_PREFIX, 'set game to schema-of-the-day >', sotd);
          this._game$.next(sotd);
        }
      });

    this.state.menuHandler = (item) =>
      defaultHandleMenuItem(this._router, this.state, item, this.manager,
        (item) => this._handlePrivateItems(item));

    this.layout$ = this.state.layout$.pipe(map(l => l.narrow ? 'column': 'row'));
  }

  private _handlePrivateItems(item: MenuItem) {
    switch (item.property) {
      case 'browse': {
        const sudoku = this.store.getSudoku(this.game);
        this.openDialog<Sudoku>(SchemasDialogComponent, (sdk) =>
          this._game$.next(sdk.values), { data: { sudoku }, autoFocus: false });
        break;
      }
      case 'solve-to': {
        const schema = this.store.getSudoku(this.game);
        this.openDialog<string>(SolveToDialogComponent, (step) =>
          this.manager?.goToStep(step), { data: { schema } })
        break;
      }
      case 'keeper': {
        this.openDialog<string>(SchemaKeeperDialogComponent, (values) =>
          this._checkValues(values));
        break;
      }
      case 'clear-highlights': {
        this.manager?.setHighlights();
        break;
      }
      case 'random': {
        const sdk = this.store.getRandomSchema();
        this._openSchema(sdk);
        break;
      }
      case 'download': {
        const sdk = this.store.getSudoku(this.game);
        console.log(...SDK_PREFIX, 'downloaded schema', sdk);
        if (sdk?.values) this._clipboard.copy(sdk.values);
        downloadSchema(sdk);
        break;
      }
      case 'check': {
        const sdk = this.store.getSudoku(this.game);
        if (sdk) this.store.checkSchema(sdk);
        break;
      }
    }
  }

  private _openSchema(sdk?: Sudoku) {
    if (!sdk) return;
    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    this.store
      .getSudokuEx(sdk.values)
      .then(sdkx => {
        if (sdkx) {
          this.manager?.load(<Sudoku>sdkx);
          const name = sdkx.values;
          const route = `/${PLAYER_PAGE_ROUTE}/${name}`;
          this.state.updateRoute(route);
          AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, { game: name });
          checkPlayerUrl(this._location, this._router, route);
        }
      })
  }

  private _init() {

    // carica il game scelto
    combineLatest([this.store.isFilled$, this._game$]).pipe(
      filter(([filled, g]) => filled && !!g),
      map(([filled, g]) => g),
      distinctUntilChanged())
      .subscribe(game => {
        const sdk = this.store.getSudoku(game);
        if (sdk) {
          if (LocalContext.isLevel('debug'))
            console.log(...SDK_PREFIX, 'apre lo schema > ', sdk._id);
          this._openSchema(sdk);
        } else {
          console.warn(SDK_PREFIX, `game not found "${game}"`);
        }
      });

    // assegna le opzioni iniziali
    this.manager?.options(
      AppUserOptions.getFeatures(PLAYER_BOARD_USER_OPTIONS_FEATURE, {
        isCoord: true,
        isAvailable: true,
        isNotify: true,
        isPasteEnabled: true,
      }), {
        editMode: 'play',
        isDynamic: false,
      });

    if (this.manager) {
      // coord mode: l'overlay FX deve allinearsi al riquadro 0..90 (non al full svg)
      this.isCoord$ = this.manager.status$.pipe(map(s => !!s.isCoord), distinctUntilChanged());
      // intercetta lo schema vuoto
      this.isEmpty$ = this.manager.stat$.pipe(map(s => s.isEmpty));
      // intercetta lo schema completo
      this.isComplete$ = this.manager.stat$.pipe(map(s => s.hasErrors || s.percent >= 100));
      // calcola le statistiche dello schema
      this.stat$ = this.manager.stat$.pipe(map(s => getStatLines(s, { visible: PLAYER_VISIBLE_STAT })));
      // salva le impostazioni utente al variare delle opzioni
      this.manager.status$.subscribe(s => AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, s));
      // aggiorna lo stato per quelle voci che dipendono dallo schema corrente
      combineLatest([this.manager.sudoku$, this.manager.status$, this.manager.stat$, this.store.isFilled$])
        .subscribe(([sdk, s, stat, filled]) =>
          this.state.updateStatus(calcStatusForMenu(sdk, s, stat, filled)));

      // FX "schema completato": solo sulla transizione incompleto→completo, senza errori.
      // - filter(!isEmpty) scarta lo stato iniziale del BehaviorSubject, così il
      //   pairwise non scatta su uno schema caricato già completo (rimane orfano
      //   di "prev incompleto").
      // - `stat.hasErrors` non è affidabile qui: `handleBoardValue` aggiorna
      //   cells$ in modo SINCRONO senza passare dal check errori (che è a carico
      //   del logic-worker, asincrono), quindi la prima emissione di stat$ dopo
      //   l'ultima cifra può avere `hasErrors=false` anche se il valore è errato.
      //   Riverifichiamo esplicitamente con `checkStatus` prima di partire.
      this.manager.stat$.pipe(
        takeUntil(this._destroy$),
        filter(s => !s.isEmpty),
        pairwise(),
        filter(([prev, curr]) => !prev.isComplete && curr.isComplete),
      ).subscribe(() => {
        const cells = _clone(this.manager!.cells$.value);
        checkStatus(cells);
        if (!hasErrors(cells)) this._playCompletionFx();
      });
    }
  }

  private _playCompletionFx() {
    // restart pulito: togli la classe play, poi riaggiungi al frame successivo.
    this.fxPlaying$.next(false);
    requestAnimationFrame(() => {
      this.fxPlaying$.next(true);
      // toast di conferma (MatSnackBar già usato in app)
      this.notifier.notify('Schema completato!', NotificationType.success, { duration: 2600 });
      // cascata ~1.1s + bordo ~1.1s: spegni il flag a fine animazione
      setTimeout(() => this.fxPlaying$.next(false), 1400);
    });
  }

  private _checkValues(values: string) {
    this.store.checkSchema(new Sudoku({ values }))
      .then(sdkx => this._game$.next(sdkx?.values||''))
      .catch(err => this._handleSchemaError(values, err));
  }

  private _handleSchemaError(values: string, error: any) {
    this._dialog
      .open(SchemaKeeperErrorDialogComponent, { data: { values, error } })
      .afterClosed()
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
    if (!this.manager) {
      this.manager = manager;
      this.manager.usePersistence = true;
      this._init();
    }
  }

  pasteSchema(values: string) {
    this._checkValues(values);
  }

  openHighlights(item: StepViewerItem) {
    if (item?.highlights) this.manager?.setHighlights(item.highlights);
    if (item?.cell) this.manager?.select(item.cell);
  }
}

const checkPlayerUrl = (location: Location, router: Router, route: string) => {
  if (!router.url.startsWith(route)) location.go(route);
}
