import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardComponent, BoardManager, PLAYER_BOARD_USER_OPTIONS_FEATURE } from '@olmi/board';
import { CommonModule, Location } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, of, takeUntil } from 'rxjs';
import { StepViewerComponent, StepViewerItem } from '@olmi/step-viewer';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { calcStatusForSchemaDeps, getStoreStatus, OPERATIONS } from './player.menu';
import { PLAYER_PAGE_ROUTE } from './player.manifest';
import { PageBase } from '../../model/page.base';
import { calcMenuStatus, defaultHandleMenuItem, downloadSchema, getStatLines, StatLine } from '../pages.helper';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './player.logic';
import { SDK_PREFIX, Sudoku } from '@olmi/model';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { SchemasDialogComponent } from '@olmi/schemas-browser';
import { MenuItem } from '../../model';
import { SchemaHeaderComponent } from '@olmi/schema-header';
import { SchemaKeeperDialogComponent } from '@olmi/schema-keeper';
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
    HighlightsEditorComponent,
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
  layout$: Observable<string>;

  private get game() {
    return this._game$.value;
  }

  constructor() {
    super();
    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    this._game$ = new BehaviorSubject<string>(o.game||'');

    const route = inject(ActivatedRoute);
    route.params
      .pipe(filter(p => !!(<any>p)?.id))
      .subscribe(p => this._game$.next((<any>p)?.id));

    this.store.isFilled$
      .pipe(takeUntil(this._destroy$), distinctUntilChanged())
      .subscribe((filled) =>
        this.state.updateStatus(getStoreStatus(filled)));

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
          this._game$.next(sdk.values), { data: { sudoku } });
        break;
      }
      case 'solve-to': {
        const schema = this.store.getSudoku(this.game);
        this.openDialog<string>(SolveToDialogComponent, (step) => this.manager?.goToStep(step), { data: { schema } })
        break;
      }
      case 'keeper': {
        this.openDialog<string>(SchemaKeeperDialogComponent, (values) => this._checkValues(values));
        break;
      }
      case 'clear-highlights': {
        this.manager?.setHighlights();
        break;
      }
      case 'download': {
        const sdk = this.store.getSudoku(this.game);
        console.log(...SDK_PREFIX, 'downloaded schema', sdk);
        if (sdk?.values) this._clipboard.copy(sdk.values);
        downloadSchema(sdk);
        break;
      }
    }
  }

  private _openSchema(sdk?: Sudoku) {
    if (!sdk) return;
    const o = AppUserOptions.getFeatures<any>(PLAYER_BOARD_USER_OPTIONS_FEATURE);
    const uvs = (<any>o.playing||{})[sdk.values];
    this.store
      .getSudokuEx(sdk.values, uvs)
      .then(sdkx => {
        if (sdkx) {
          this.manager?.load(<Sudoku>sdkx);
          const name = sdkx.values;
          const route = `/${PLAYER_PAGE_ROUTE}/${name}`;
          this.state.updateStatus({ route });
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
      }));

    if (this.manager) {
      // intercetta lo schema vuoto
      this.isEmpty$ = this.manager.stat$.pipe(map(s => s.isEmpty));
      // intercetta lo schema completo
      this.isComplete$ = this.manager.stat$.pipe(map(s => s.hasErrors || s.percent >= 100));
      // calcola le statistiche dello schema
      this.stat$ = this.manager.stat$.pipe(map(s => getStatLines(s, { visible: PLAYER_VISIBLE_STAT })));
      // aggiorna lo stato del menu e salva le impostazioni utente al variare delle opzioni
      this.manager.status$.subscribe(s => {
        this.state.updateStatus(calcMenuStatus(OPERATIONS, s));
        AppUserOptions.updateFeature(PLAYER_BOARD_USER_OPTIONS_FEATURE, s);
      });
      // aggiorna lo stato per quelle voci che dipendono dallo schema corrente
      this.manager.sudoku$.subscribe(sdk =>
        this.state.updateStatus(calcStatusForSchemaDeps(sdk)));
    }
  }


  private _checkValues(values: string) {
    this.store.checkSchema(new Sudoku({ values }))
      .then(sdkx => this._game$.next(sdkx?.values||''));
  }

  ready(manager: BoardManager) {
    if (!this.manager) {
      this.manager = manager;
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
