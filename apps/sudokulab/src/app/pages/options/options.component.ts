import { AfterViewInit, ChangeDetectionStrategy, Component, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import {
  isDebugMode, LabFacade,
  setDebugMode,
  SudokuFacade,
  SUDOKULAB_DARK_THEME,
  SUDOKULAB_LIGHT_THEME, SUDOKULAB_MANAGE_OPERATION, SUDOKULAB_SESSION_DEVELOP, SUDOKULAB_SESSION_STANDARD,
  SudokulabWindowService
} from '@sudokulab/model';
import { map, skip } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare const gapi: any;

@Component({
  selector: 'sudokulab-options-page',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent implements AfterViewInit {
  isDebugMode$: BehaviorSubject<boolean>;
  isDarkTheme$: Observable<boolean>;
  showAvailable$: Observable<boolean>;
  googleok$: BehaviorSubject<boolean>;
  googleok_check$: Observable<boolean>;
  isManagement$: Observable<boolean>;
  operationStatus$: Observable<number>;
  isOperationActive$: Observable<boolean>;
  OPERATION = SUDOKULAB_MANAGE_OPERATION;

  constructor(private _sudoku: SudokuFacade,
              private _lab: LabFacade,
              private _window: SudokulabWindowService,
              private _zone: NgZone) {




    this.isDebugMode$ = new BehaviorSubject<boolean>(isDebugMode());
    this.googleok$ = new BehaviorSubject<boolean>(true);
    this.googleok_check$ = this.googleok$.pipe(skip(1));
    this.isDarkTheme$ = _sudoku.selectTheme$.pipe(map(theme => theme === SUDOKULAB_DARK_THEME));
    this.isManagement$ = combineLatest(_sudoku.selectToken$, _sudoku.selectAppInfo$).pipe(
      map(([t, info]) => !!t || info?.session === SUDOKULAB_SESSION_DEVELOP || !environment.production));
    this.operationStatus$ = _sudoku.selectOperationStatus$;
    this.isOperationActive$ = this.operationStatus$.pipe(map(o => (o||-1)>=0));
    this.showAvailable$ = _lab.selectActiveSudoku$.pipe(map(sdk => !!sdk?.options?.showAvailables));
  }

  private _initGoogleApi() {
    const btn = this._window.nativeWindow.document.getElementById('google-login-button');
    gapi.load('client:auth2', () =>
      gapi.auth2.init({
        client_id: environment.google.client_id,
        cookie_policy: 'single_host_origin',
        scope: 'profile email'
      }).then(() => gapi.auth2.attachClickHandler(btn, {},
        (googleUser: any) =>
          this._zone.run(() => {
            const profile = googleUser.getBasicProfile();
            this._sudoku.googleLogin({
              accessToken: googleUser.getAuthResponse().id_token,
              name: profile.getName(),
              email: profile.getEmail(),
              picture: profile.getImageUrl()
            });
            this.googleok$.next(true);
          }),
        (error: any) =>
          this._zone.run(() =>
            this._error(error))),
        (err: any) =>
          this._zone.run(() =>
            this._error(err))));
  }

  setDebugMode(e: any) {
    setDebugMode(e.checked);
  }
  setDarkTheme(e: any) {
    this._sudoku.setTheme(e.checked ? SUDOKULAB_DARK_THEME : SUDOKULAB_LIGHT_THEME);
  }

  apply(v: any, target: string) {
    this._lab.updatePlayerOptions({ [target]: v });
  }

  manage(operation: string, args?: any) {
    this._sudoku.manage(operation, args);
  }

  private _error(err: any, hidden = false) {
    if (!hidden) {
      this._sudoku.raiseError(err);
    }
    this.googleok$.next(false);
  }

  ngAfterViewInit() {
    this._initGoogleApi();
  }
}
