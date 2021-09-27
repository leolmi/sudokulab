import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { get as _get, has as _has, set as _set } from 'lodash';
import { SDK_PREFIX, SUDOKULAB_SETTINGS_KEY } from '../consts';
import { updateBehaviorSubject } from '../../global.helper';


@Injectable()
export class SudokulabSettingsService implements OnDestroy {
  private readonly _destroy$: Subject<boolean>;
  private _settings$: BehaviorSubject<any>;
  constructor() {
    this._destroy$ = new Subject<boolean>();
    const data_str = localStorage.getItem(SUDOKULAB_SETTINGS_KEY)||'{}';
    let user_data = {};
    try {
      user_data = JSON.parse(data_str);
    } catch (err) {
      console.warn(SDK_PREFIX, 'user settings corrupted', data_str);
    }
    this._settings$ = new BehaviorSubject<any>(user_data);

    this._settings$
      .pipe(takeUntil(this._destroy$), skip(1))
      .subscribe(s => localStorage.setItem(SUDOKULAB_SETTINGS_KEY, JSON.stringify(s)));
  }

  generate<T>(path: string, initial?: T): BehaviorSubject<T> {
    const settings = this._settings$.getValue();
    const value = _has(settings, path) ? _get(settings, path) : initial;
    const property$ = new BehaviorSubject<T>(value);
    property$.pipe(takeUntil(this._destroy$), skip(1))
      .subscribe(v => updateBehaviorSubject(this._settings$, s => _set(s, path, v)))
    return property$;
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
