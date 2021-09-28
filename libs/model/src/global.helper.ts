import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { extend as _extend, isString as _isString, cloneDeep as _clone, keys as _keys, isEqual as _isEqual } from 'lodash';
import { SudokulabWindowService } from './lib/services';

export const use = <T>(o$: Observable<T>, handler: (o:T) => any): any => o$.pipe(take(1)).subscribe(o => handler(o));

export const getHash = (o: any): number => {
  o = o || '';
  if (!_isString(o)) {
    o = JSON.stringify(o);
  }
  let hash = 0, i, chr;
  if (o.length === 0) {
    return hash;
  }
  for (i = 0; i < o.length; i++) {
    chr = o.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export const update = <T>(o: T, chs?: Partial<T>, handler?: (c:T) => void): T => {
  const co = <T>_clone(o||{});
  if (!!chs) _extend(co, chs||{});
  if (!!handler) handler(co);
  return co;
}

export const updateBehaviorSubject = <T>(bs$: BehaviorSubject<T>, handler: (c: T) => boolean): void =>
  use(bs$, o => {
    const co = _clone(o);
    if (handler(co)) bs$.next(co);
  });

export const isMutation = (o: any, c: any): boolean =>
  !!o && !!c && !!_keys(c||{}).find(k => !_isEqual(c[k],o[k]));

export const isCompact = (ws: SudokulabWindowService): boolean => (ws.nativeWindow?.innerWidth || 2000) < 1450;
