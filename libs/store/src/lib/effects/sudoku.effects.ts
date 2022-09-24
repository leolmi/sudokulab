import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as SudokuActions from '../actions';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  checkAvailables,
  getHash,
  GoogleCredentials,
  MessageType,
  PlaySudoku,
  saveUserSetting,
  setApplicationTheme,
  Sudoku,
  OPERATION_NEED_RELOAD_DOCS,
  SudokulabWindowService,
  SudokuMessage,
  SudokulabInfo
} from '@sudokulab/model';
import { cloneDeep as _clone } from 'lodash';
import * as SudokuSelectors from '../selectors';
import { Action, createAction, props, Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';


@Injectable()
export class SudokuEffects {
  _manage = createAction('[SudokuLab.sudoku.private] manage', props<{ operation: string, args?: any }>());


  doGoogleLogin = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.doGoogleLogin),
    switchMap((a) => this._http.post<GoogleCredentials>('/api/auth/google', a.credentials).pipe(
      switchMap(resp => [SudokuActions.setToken({ token: resp.accessToken })]),
      catchError((err) => [
        SudokuActions.setActiveMessage({
          message: new SudokuMessage({
            message: 'Cannot access!',
            type: MessageType.error
          })
        }),
        SudokuActions.setToken({})
      ])
    ))
  ));

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    filter(a => a.page?.code !== 'lab'),
    concatMap(a => {
      this._router.navigate([`${a.page?.code}`]);
      return [SudokuActions.updateDocumentTitle({})];
    })
  ));

  checkSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.checkSudoku),
    switchMap((a) => {
      const sdk: Sudoku = <Sudoku>_clone(a.schema);
      sdk._id = sdk._id || getHash(sdk.fixed);
      sdk.values = sdk.fixed;
      (sdk.info?.algorithms || []).forEach(a => a.cases = []);
      return this._http.post<Sudoku>('/api/sudoku/check', sdk).pipe(
        switchMap((res) => {
          console.log('CHECK RESULT', res);
          return !!res ? [SudokuActions.fillSchemas()] : [];
        }));
    })
  ));

  fillSchemas$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.fillSchemas),
    switchMap(() => this._http.get<Sudoku[]>('/api/sudoku/list').pipe(
      map(schemas => schemas.map(sudoku => {
        const ps = new PlaySudoku({ sudoku });
        checkAvailables(ps);
        return ps;
      })),
      switchMap((schemas) => [SudokuActions.loadSchemas({ schemas })])))
  ));

  updateDocumentTitle$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.updateDocumentTitle),
    withLatestFrom(this._store.select(SudokuSelectors.selectActivePage)),
    map(([a, page]) => document.title = page ? `SudokuLab - ${page.title} ${a.data||''}` : 'SudokuLab')
  ), { dispatch: false });

  resetOptions$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.resetOptions),
    map(() => {
      // TODO: reset options...
      console.log('reset user options...');
    })
  ), { dispatch: false });

  setTheme$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setTheme),
    map((a) => {
      setApplicationTheme(this._window, a.theme);
      saveUserSetting('sudoku.theme', a.theme);
    })
  ), { dispatch: false });

  setValuesMode$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setValuesMode),
    map((a) => saveUserSetting('sudoku.valuesMode', a.valuesMode))
  ), { dispatch: false });

  setEnvironment$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setEnvironment),
    concatMap(() => this._http.get<SudokulabInfo>('/api/sudokulab').pipe(
      switchMap(info => [SudokuActions.setAppInfo({ info })])
    ))
  ));

  _manage$ = createEffect(() => this._actions$.pipe(
    ofType(this._manage),
    withLatestFrom(this._store.select(SudokuSelectors.selectEnvironment)),
    switchMap(([a, env]) => this._http.post(`/api/sudoku/manage${env.production?'':'dev'}`, a).pipe(
      switchMap((resp) => {
        const output: Action[] = [
          SudokuActions.setOperationStatus({ status: -1 }),
          SudokuActions.setActiveMessage({
            message: new SudokuMessage({
              message: `Operation "${a.operation}" successfully executed!`,
              type: MessageType.success
            })
          })
        ];
        if (OPERATION_NEED_RELOAD_DOCS[a.operation]) output.push(SudokuActions.fillSchemas());
        return output;
      }),
      catchError(err => [
        SudokuActions.setOperationStatus({ status: -1 }),
        SudokuActions.setActiveMessage({
          message: new SudokuMessage({
            message: `Error while executing operation "${a.operation}"`,
            type: MessageType.error
          })
        })
      ])
    ))
  ));

  manage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.manage),
    switchMap(a => [
      SudokuActions.setOperationStatus({ status: 1 }),
      this._manage(a)
    ])
  ));


  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>,
              private _window: SudokulabWindowService,
              private _router: Router,
              private _http: HttpClient) {
  }
}
