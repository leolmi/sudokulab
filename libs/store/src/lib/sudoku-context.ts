import {Injectable, Type} from '@angular/core';
import {
  CameraDialogOptions,
  debug,
  GoogleCredentials,
  HandleImageOptions,
  HandleImageResult,
  isCompact,
  MessageType,
  PlaySudoku,
  SDK_PREFIX_DEBUG,
  Sudoku,
  SudokuFacade,
  SudokulabInfo,
  SudokulabPage,
  SudokulabWindowService,
  SudokuMessage,
  UploadDialogOptions,
  UploadDialogResult
} from '@sudokulab/model';
import {Store} from '@ngrx/store';
import {SudokuStore} from './sudoku-store';
import {BehaviorSubject, Observable} from 'rxjs';
import * as SudokuActions from './actions';
import * as GeneratorActions from './actions';
import * as SudokuSelectors from './selectors';
import {Dictionary} from '@ngrx/entity';
import {distinctUntilChanged, filter, switchMap, takeUntil} from 'rxjs/operators';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {isFunction as _isFunction} from 'lodash';
import {isLoadedSchemas} from "./selectors";

@Injectable()
export class SudokuContext extends SudokuFacade {
  private _isCompact$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(isCompact(this._window));
  private _upload$: BehaviorSubject<boolean|undefined> = new BehaviorSubject<boolean|undefined>(undefined);
  private _camera$: BehaviorSubject<boolean|undefined> = new BehaviorSubject<boolean|undefined>(undefined);
  private _handleImage$: BehaviorSubject<HandleImageOptions|undefined> = new BehaviorSubject<HandleImageOptions|undefined>(undefined);
  private _checkSchema$: BehaviorSubject<HandleImageResult|undefined> = new BehaviorSubject<HandleImageResult|undefined>(undefined);

  selectIsLoadedSchemas$: Observable<boolean> = this._store.select(SudokuSelectors.isLoadedSchemas);
  selectAppInfo$: Observable<SudokulabInfo|undefined> = this._store.select(SudokuSelectors.selectAppInfo);
  selectAllSchemas$: Observable<PlaySudoku[]> = this._store.select(SudokuSelectors.selectAllSudoku);
  selectActiveMessage$: Observable<SudokuMessage|undefined> = this._store.select(SudokuSelectors.selectActiveMessage);
  selectActivePage$: Observable<SudokulabPage|undefined> = this._store.select(SudokuSelectors.selectActivePage);
  selectPageStatus$: Observable<Dictionary<boolean>> = this._store.select(SudokuSelectors.selectPageStatus);
  selectIsCompact$: Observable<boolean> = this._isCompact$.pipe(distinctUntilChanged());
  selectTheme$: Observable<string> = this._store.select(SudokuSelectors.selectTheme);
  selectValuesMode$: Observable<string> = this._store.select(SudokuSelectors.selectValuesMode);
  selectToken$: Observable<string> = this._store.select(SudokuSelectors.selectToken);
  selectOperationStatus$: Observable<number> = this._store.select(SudokuSelectors.selectOperationStatus);
  selectUserSettings$: Observable<any> = this._store.select(SudokuSelectors.selectUserSettings);

  setEnvironment(env: any) {
    this._store.dispatch(SudokuActions.setEnvironment({ env }));
  }

  googleLogin(credentials: GoogleCredentials) {
    this._store.dispatch(SudokuActions.doGoogleLogin({ credentials }));
  }

  fillDocuments() {
    this._store.dispatch(SudokuActions.fillSchemas());
  }

  setActivePage(page: SudokulabPage|undefined, data?: any) {
    if (!!page) this._store.dispatch(SudokuActions.setActivePage({ page, data }));
  }

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  raiseError(err: any) {
    this._store.dispatch(SudokuActions.setActiveMessage({
      message: new SudokuMessage({
        message: JSON.stringify(err),
        type: MessageType.error
      })
    }));
  }

  upload(open = true) {
    this._upload$.next(open);
  }

  loadSudoku(sudoku: Sudoku|undefined, onlyValues?: boolean) {
    debug(() => console.log(...SDK_PREFIX_DEBUG, 'loading sudoku', sudoku));
    if (!!sudoku) this._store.dispatch(SudokuActions.loadSudokuRequest({ sudoku, onlyValues }));
  }

  loadSchema(schema: Sudoku) {
    this._store.dispatch(GeneratorActions.loadGeneratorSchema({ schema }));
  }

  checkCompactStatus() {
    this._isCompact$.next(isCompact(this._window));
  }

  saveUserSettings() {
    this._store.dispatch(SudokuActions.saveUserSettings());
  }

  clearUserSettings() {
    this._store.dispatch(SudokuActions.clearUserSettings());
  }

  checkStatus() {
    this._store.dispatch(SudokuActions.checkStatus());
  }

  setTheme(theme: string) {
    this._store.dispatch(SudokuActions.setTheme({ theme }));
  }

  setValuesMode(valuesMode: string) {
    this._store.dispatch(SudokuActions.setValuesMode({ valuesMode }));
  }

  handleImage(o?: HandleImageOptions) {
    this._handleImage$.next(o);
  }

  camera(open: boolean|undefined = true) {
    this._camera$.next(open);
  }

  checkSchema(o: HandleImageResult) {
    this._checkSchema$.next(o);
  }

  raiseGenericAction(code: string, data?: any) {
    if (_isFunction(this.doGenericAction)) this.doGenericAction(code, data);
  }

  onUpload(component: Type<any>, destroyer$: Observable<any>, options?: UploadDialogOptions): Observable<UploadDialogResult|any> {
    return this._on(this._upload$, component, destroyer$, { width: '600px' }, options);
  }

  onHandleImage(component: Type<any>, destroyer$: Observable<any>): void {
    this._on<HandleImageOptions, any, HandleImageResult>(this._handleImage$, component, destroyer$, { width: '600px', panelClass: 'full-screen' })
      .pipe(filter(res => !!res?.sdk))
      .subscribe(res => !!res ? this._checkSchema$.next(res) : null);
  }

  onCamera(component: Type<any>, destroyer$: Observable<any>, options?: CameraDialogOptions): void {
    this._on(this._camera$, component, destroyer$, { width: '800px', panelClass: 'full-screen', disableClose: true }, options)
      .pipe(filter(res => !!(<HandleImageOptions>res)?.image))
      .subscribe(res => !!res ? this._handleImage$.next(<HandleImageOptions>res) : null);
  }

  onCheckSchema(component: Type<any>, destroyer$: Observable<any>): void {
    this._on(this._checkSchema$, component, destroyer$, { width: '454px', panelClass: 'full-screen' })
      .pipe(filter(res => !!(<HandleImageResult>res)?.sdk))
      .subscribe((res) => this.loadSudoku((<HandleImageResult>res).sdk, (<HandleImageResult>res).onlyValues));
  }

  manage(component: Type<any>, operation: string, args?: any) {
    this._dialog.open(component, { width: '400px' })
      .afterClosed()
      .pipe(filter(key => !!key))
      .subscribe(key => this._store.dispatch(SudokuActions.manage({ operation, key, args })));
  }


  constructor(private _store: Store<SudokuStore>,
              private _dialog: MatDialog,
              private _window: SudokulabWindowService) {
    super();
  }

  private _on<T, O, R>(o$: BehaviorSubject<T|undefined>,
                       component: Type<any>,
                       destroyer$: Observable<any>,
                       config: Partial<MatDialogConfig>,
                       options?: O): Observable<R> {
    return o$.pipe(
      takeUntil(destroyer$),
      filter(o => !!o && !isAlwaysOpened(this._dialog, component)),
      switchMap((o) => {
        o$.next(undefined);
        return this._dialog
          .open(component, { ...config,  data: options||o })
          .afterClosed()
      }));
  }
}

export const isAlwaysOpened = (dialog: MatDialog, component: any): boolean => {
  return !!(dialog.openDialogs||[]).find(dlg => dlg.componentInstance instanceof component);
}
