import {
  buildSudokuInfo,
  calcFixedCount,
  clearSchema,
  debug,
  getCompactLevel,
  getErrorMessage,
  getHash,
  HandleImageResult,
  ImportOptions,
  loadSchema,
  loadValues,
  MessageType,
  OPERATION_NEED_RELOAD_DOCS,
  PlaySudoku,
  PlaySudokuOptions,
  saveUserSetting,
  SchemasOptions,
  SDK_PREFIX_DEBUG,
  setApplicationTheme,
  Solver,
  Sudoku,
  SUDOKU_AUTHOR_LINK,
  SudokuData,
  SudokuInfo,
  SudokuLab,
  SudokulabInfo,
  SudokulabPage,
  SudokulabPagesService,
  SudokuLabState,
  SudokulabWindowService,
  SudokuMessage,
  updateSchema
} from "@sudokulab/model";
import {Injectable} from "@angular/core";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {BehaviorSubject, Observable, of, Subject} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, take} from "rxjs/operators";
import {MatSnackBar} from "@angular/material/snack-bar";
import {HttpClient} from "@angular/common/http";
import {AvailablePages, SOLVER_STEP_DETAILS} from "./model";
import {CameraDialogComponent} from "./components/camera-dialog/camera-dialog.component";
import {SolverStepDetailsPopupComponent} from "./components/solver-step-details/solver-step-details-popup.component";
import {ImageHandlerComponent} from "./components/image-handler/image-handler.component";
import {SchemaCheckComponent} from "./components/schema-check/schema-check.component";
import {cloneDeep as _clone, extend as _extend} from 'lodash';
import {environment} from '../environments/environment';
import {fromPromise} from "rxjs/internal-compatibility";
import {Router} from "@angular/router";
import {Location} from "@angular/common";
import {SudokulabExecutorsService} from "./services/sudokulab-executors.service";
import {UploadDialogComponent} from "./components/upload-dialog/upload-dialog.component";

const API = {
  check: '/api/sudoku/check',
  schemas: '/api/sudoku/list',
  infos: '/api/sudokulab',
  manage: '/api/sudoku/manage',
  managedev: '/api/sudoku/managedev',
}

@Injectable()
export class SudokuLabLogic extends SudokuLab {
  state: SudokuLabState;
  pages: SudokulabPage[];
  internalCode$: Subject<string>;
  context$: BehaviorSubject<SudokuData<any>|undefined>;

  constructor(private _http: HttpClient,
              private _router: Router,
              private _location: Location,
              private _dialog: MatDialog,
              private _snack: MatSnackBar,
              private _window: SudokulabWindowService,
              private _executors: SudokulabExecutorsService,
              private _pagesProvider: SudokulabPagesService) {
    super();
    this.context$ = new BehaviorSubject<SudokuData<any> | undefined>(undefined);
    this.internalCode$ = new Subject<string>();
    this.pages = _pagesProvider.pages;
    this.state = new SudokuLabState(environment);
    setFirstPage(this.state, _pagesProvider.pages);

    this.state.theme$
      .pipe(filter(thm => !!thm), distinctUntilChanged())
      .subscribe(theme => setTheme(theme, _window));

    this.state.page$
      .pipe(filter(p => !!p), distinctUntilChanged((p1,p2) => p1?.code === p2?.code))
      .subscribe((p) => p ? this._router.navigateByUrl(p.getUrl(this)) : null);
  }

  /**
   * carica le info dell'app
   * @private
   */
  private async _loadInfos() {
    return new Promise((next) => {
      this._http.get<SudokulabInfo>(API.infos).pipe(
        debounceTime(50),
        catchError((err) => checkApiError(this, 'error while loading app info', err)),
        take(1))
        .subscribe((info) => {
          if (!!info) this.state.info$.next(info);
          next(info);
        })
    });
  }

  /**
   * carica gli schemi disponibili
   * @private
   */
  private async _loadSchemas() {
    return new Promise((next) => {
      this._http.get<Sudoku[]>(API.schemas).pipe(
        debounceTime(50),
        catchError((err) => checkApiError(this, 'error while loading schemas', err)),
        take(1))
        .subscribe(schemas => {
          if (schemas.length>0) this.state.schemas$.next(schemas||[])
          next(schemas||[]);
        });
    });
  }

  /**
   * bootstrap applicazione
   */
  async bootstrap() {
    this.state.waiting$.next(true);
    // - caricare le app info
    await this._loadInfos();
    // - caricare i documenti
    await this._loadSchemas();
    // - verifica lo stato compact
    this.checkCompactStatus();
    // fine bootstrap
    this.state.waiting$.next(false);
  }

  emit(internal_code: string) {
    this.internalCode$.next(internal_code);
  }

  /**
   * Verifica lo stato compact
   */
  checkCompactStatus() {
    const cl = getCompactLevel(this._window);
    const acl = this.state.compactLevel$.value;
    if (cl !== acl) this.state.compactLevel$.next(cl);
  }

  /**
   * Apre le info autore
   */
  authorInfo() {
    this._window.nativeWindow.open(SUDOKU_AUTHOR_LINK, "_blank");
  }

  /**
   * gestione sudoku-lab
   * @param operation
   * @param key
   * @param args
   */
  manage(operation: string, key: string, args?: any): Observable<any> {
    // effettua le operazioni di gestione
    const env = this.state.env$.value;
    const url = env.production ? API.manage : API.managedev;
    return this._http.post(url, {operation, key, args}).pipe(
      take(1),
      switchMap((res) => {
        this.showMessage(new SudokuMessage({
          message: `Operation "${operation}" successfully executed!`,
          type: MessageType.success
        }));
        return OPERATION_NEED_RELOAD_DOCS[operation] ?
          fromPromise(this._loadSchemas()) : of(true);
      }),
      catchError((err) =>
        checkApiError(this, `error while executing operation "${operation}"`, err)));
  }

  /**
   * mostra i messaggi
   * @param message
   */
  showMessage(message: SudokuMessage): void {
    this._snack.open(message?.message || 'unknown', message?.action, {
      duration: message?.duration || 3000,
      panelClass: `message-type-${message?.type || 'info'}`,
    }).afterDismissed()
      .subscribe(r => {
        if (r.dismissedByAction && message?.actionCode) {
          setTimeout(() => this.executeAction(message?.actionCode || '', message.data));
        }
      });
  }

  /**
   * mostra i messaggi d'errore
   * @param err
   * @param message
   */
  raiseError(err: any, message?: string) {
    this.showMessage(new SudokuMessage({
      type: MessageType.error,
      message: message || getErrorMessage(err),
      data: err
    }));
  }

  /**
   * esegue le azioni generiche
   * @param code
   * @param data
   */
  executeAction(code: string, data: any) {
    switch (code) {
      case SOLVER_STEP_DETAILS:
        this._dialog.open(SolverStepDetailsPopupComponent, {
          width: '600px',
          panelClass: 'sudokulab-solver-step-details',
          data
        });
        break;
    }
  }

  /**
   * esegue il codice dalla pagina attiva
   * @param code
   */
  executePageCode(code: string) {
    const page = this.state.page$.value;
    const real_page = this.pages.find(p => p.code === page?.code);
    if (!!real_page?.executor) {
      const executor = this._executors.getExecutor(real_page.executor);
      if (executor) executor.execute(this, code);
    }
  }

  /**
   * Analizza lo schema
   * @param sdk
   */
  analyze(sdk: PlaySudoku): Observable<Sudoku | undefined> {
    const solver = new Solver(sdk);
    let message: SudokuMessage | undefined = undefined;
    const check_message = solver.check();
    if (!!check_message) {
      message = new SudokuMessage({message: check_message, type: MessageType.warning});
    } else {
      let schema: Sudoku;
      const result = solver.solve();
      if (result.unique) {
        schema = <Sudoku>_clone(result.unique.sdk.sudoku);
        schema.info = buildSudokuInfo(schema, {
          unique: true,
          algorithms: result.unique.algorithms
        }, true);
        sdk.sudoku = schema;
        clearSchema(sdk);
        this.remoteCheckSchema(sdk)
          .subscribe(() => this.activateSelectedSchema(sdk._id));
      } else if (result.multiple) {
        schema = <Sudoku>_clone(result.solutions[0].sdk.sudoku);
        schema.info = new SudokuInfo({
          rank: schema.rank,
          fixedCount: calcFixedCount(schema.fixed)
        });
        sdk.sudoku = schema;
      } else {
        message = new SudokuMessage({
          message: 'wrong schema',
          type: MessageType.warning
        });
        console.log(message.message, result);
      }
    }
    if (!!message) this.showMessage(message);
    return of(undefined);
  }

  /**
   * carica lo schema nel contesto corrente
   * @param o
   */
  loadSudoku(o?: ImportOptions): Observable<any> {
    // carica lo schema nel target definito (board-data / generator-data)
    if (!o) return notifyError(this, 'undefined options!', false);
    if (!o?.context && !!this.context$.value) o.context = this.context$.value;
    if (!o?.context) return notifyError(this, 'undefined context!', false);
    if (!o?.sdk) return notifyError(this, 'undefined schema', false);

    debug(() => console.log(...SDK_PREFIX_DEBUG, `loading sudoku (onlyValues=${!!o?.onlyValues})`, o.sdk));
    let message = '';
    updateSchema(o.context, (sdk) => {
      if (o.onlyValues) {
        message = 'Values loaded successfully';
        loadValues(sdk, o.sdk?.values || '');
        return true;
      } else {
        message = 'Schema loaded successfully';
        loadSchema(sdk, o.sdk);
        return this.analyze(sdk).pipe(
          take(1),
          map(s => !!s));
      }
    }).then(() => this.showMessage(new SudokuMessage({
      message,
      type: MessageType.success,
    })));
    return of(o.sdk);
  }

  /**
   * permette all'utente di gestire lo schema in import verificando lo schema,
   * e modificandone i valori
   * @param o
   */
  checkSchema(o?: ImportOptions): Observable<HandleImageResult> {
    const dialog = getOpened(this._dialog, SchemaCheckComponent) ||
      this._dialog.open(SchemaCheckComponent, {
        width: '454px',
        panelClass: 'full-screen',
        disableClose: true,
        data: o
      });
    return dialog.afterClosed().pipe(
      filter(res => !!res.sdk),
      // carica lo schema in import
      switchMap((res: ImportOptions) => this.loadSudoku(res)));
  }

  /**
   * interpreta l'immagine
   * - l'interprete invia l'immagine al gestore di schema
   * - il gestore di schema apre lo schema o valorizza l'esistente
   * @param o
   */
  handleImage(o?: ImportOptions): Observable<HandleImageResult> {
    // apre il tool di verifica dell'immagine
    const dialog = getOpened(this._dialog, ImageHandlerComponent) ||
      this._dialog.open(ImageHandlerComponent, {
        width: '600px',
        panelClass: 'full-screen',
        disableClose: true,
        data: o
      });
    return dialog.afterClosed().pipe(
      filter(res => !!(<ImportOptions>res).sdk),
      // delega la verifica dello schema
      switchMap(res => this.checkSchema(res)));
  }

  /**
   * acquisisce schemi dalla telecamera
   * - apre popup telecamera
   * - se confermata invia l'immagine all'interprete delle immagini
   * - l'interprete invia l'immagine al gestore di schema
   * - il gestore di schema apre lo schema o valorizza l'esistente
   * @param o
   */
  camera(o?: Partial<ImportOptions>): Observable<HandleImageResult> {
    const dialog = getOpened(this._dialog, CameraDialogComponent) ||
      this._dialog.open(CameraDialogComponent, {
        width: '800px',
        panelClass: 'full-screen',
        disableClose: true,
        data: o
      });
    return dialog.afterClosed().pipe(
      filter(res => !!(<ImportOptions>res)?.image),
      // gestisce l'immagine
      switchMap(res => this.handleImage(res)))
  }

  /**
   * procedura di caricamento schema
   */
  upload(): Observable<any> {
    const o = new ImportOptions();
    switch (this.state.page$.value?.code) {
      case AvailablePages.lab:
        o.allowEditOnGrid = true;
        o.allowImages = true;
        o.allowOnlyValues = true;
        o.sdk = this.state.activePlaySudoku$.value?.sudoku;
        // o.context = ???
        break;
      case AvailablePages.generator:
        o.sdk = this.state.activeGeneratorSudoku$.value?.sudoku;
        // o.context = ???
        break;
    }
    const dialog = getOpened(this._dialog, UploadDialogComponent) ||
      this._dialog.open(UploadDialogComponent, {
        width: '600px',
        disableClose: true,
        data: o
      });

    return dialog.afterClosed().pipe(
      filter((res: ImportOptions) => !!res),
      switchMap((res: ImportOptions) => {
        if (res.editOnGrid) return this.checkSchema({ sdk: res.sdk,  })
        if (res.sdk) return this.loadSudoku(res);
        return this.handleImage(res);
      }));
  }

  /**
   * effettua il check remoto
   * @param sdk
   */
  remoteCheckSchema(sdk: PlaySudoku): Observable<any> {
    const schema = getSchema(sdk);
    clearSchema(schema);
    return this._http.post<Sudoku>(API.check, sdk.sudoku).pipe(
      catchError((err) => {
        this.showMessage(new SudokuMessage({
          message: `Error while check schema`,
          type: MessageType.error,
          data: err
        }));
        return of(undefined);
      }),
      map((res) => {
        debug(() => console.log(...SDK_PREFIX_DEBUG, 'check result', res));
        if (!!res) this._loadSchemas();
      }));
  }

  /**
   * attiva lo schema selezionato
   */
  activateSelectedSchema(id?: number) {
    if (!!id) this.state.selectedSudokuId$.next(id);
    const target = this.state.selectedSudokuId$.value;
    this.state.activeSudokuId$.next(target);
    const page = this.state.page$.value;
    if (page?.code === AvailablePages.lab) this._location.go(`/${page?.code}/${target}`);
  }

  /**
   * aggiorna le opzioni per l'elenco degli schemi
   * @param o
   */
  updateSchemasOptions(o?: Partial<SchemasOptions>) {
    const opt = _clone(this.state.schemasOptions$.value);
    _extend(opt, o);
    this.state.schemasOptions$.next(opt);
  }

  updatePlayerOptions(o?: Partial<PlaySudokuOptions>) {
    // TODO...

  }

  /**
   * aggiorna lo stato di abilitazione/selezione degli elementi della pagina
   * @param ps
   */
  updatePageStatus(ps: any) {
    const status = _clone(this.state.pagesStatus$.value)
    _extend(status, ps);
    this.state.pagesStatus$.next(status);
  }
}

/**
 * notifica gli errori
 * @param sl
 * @param message
 * @param returnValue
 * @param data
 */
const notifyError = <T>(sl: SudokuLab, message: string, returnValue: T, data?: any): Observable<T> => {
  console.error(message, data);
  return of(returnValue);
}

/**
 * verifica l'errore su chiamata api
 * @param lab
 * @param message
 * @param err
 */
const checkApiError = (lab: SudokuLab, message: string, err: any): Observable<any> => {
  lab.showMessage(new SudokuMessage({
    message,
    type: MessageType.error,
    data: err
  }));
  return of(undefined);
}

/**
 * restituisce il dialog già aperto del tipo specificato
 * @param dialog
 * @param component
 */
const getOpened = (dialog: MatDialog, component: any): MatDialogRef<any>|undefined => {
  return (dialog.openDialogs || []).find(dlg => dlg.componentInstance instanceof component);
}

/**
 * Restituisce lo schema puro
 * @param sdk
 */
const getSchema = (sdk: PlaySudoku): Sudoku => {
  const scm: Sudoku = <Sudoku>_clone(sdk.sudoku);
  scm._id = scm._id || getHash(scm.fixed);
  scm.values = scm.fixed;
  (scm.info?.algorithms || []).forEach(a => a.cases = []);
  return scm;
}


const setFirstPage = (state: SudokuLabState, pages: SudokulabPage[]) => {
  const page = (pages||[]).find(p => p.default)||pages[0];
  if (page) state.page$.next(page);
}

const setTheme = (theme: string, wins: SudokulabWindowService) => {
  setApplicationTheme(wins, theme);
  saveUserSetting([{ path: 'sudoku.theme', data: theme}]);
}
