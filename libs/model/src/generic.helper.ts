import { BehaviorSubject } from 'rxjs';
import { cloneDeep as _clone, isFunction as _isFunction, isString as _isString } from 'lodash';
import { ValueType } from './lib';

export function guid(): string {
  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, c => {
    /* tslint:disable */
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    /* tslint:enable */
  });
}

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

/**
 * compara due elementi come stringhe (lower case / trim)
 * @param v1
 * @param v2
 */
export const isEqualCaseInsensitive = (v1: any, v2: any): boolean =>
  `${v1||''}`.toLowerCase().trim() === `${v2||''}`.toLowerCase().trim();

/**
 * vero se v2 è vaòorizzato e v1 contiene v2 (lower case / trim)
 * @param v1
 * @param v2
 */
export const containsCaseInsensitive = (v1: any, v2: any): boolean => {
  const v1_str = `${v1 || ''}`.toLowerCase().trim();
  const v2_str = `${v2 || ''}`.toLowerCase().trim();
  return !!v2_str && v1_str.includes(v2_str);
}


/**
 * update behavior-subject with passes partial
 * @param o$
 * @param chs
 */
export const update = <T>(o$: BehaviorSubject<T>, chs: Partial<T>) => o$.next({ ...o$.value, ...chs });

/**
 * aggiorna l'observable solo quando il valore cambia
 * @param o$
 * @param value
 */
export const updateOnChanges = <T>(o$: BehaviorSubject<T>, value: T) =>
  (o$.value !== value) ? o$.next(value) : null;

/**
 * update behavior-subject with passes partial
 * @param o$
 * @param handler
 */
export const handleUpdate = <T>(o$: BehaviorSubject<T>, handler: (co: T) => boolean) => {
  const co = _clone(o$.value);
  if (handler(co)) o$.next(co);
}

/**
 * Alterna l'applicazione della classe secondo il booleano
 * @param e
 * @param className
 * @param apply
 */
export const toggleClass = (e: HTMLElement|null|undefined, className: string, apply = true) => {
  if (!e || !e.classList) return;
  if (apply) {
    if (!e.classList.contains(className)) e.classList.add(className);
  } else {
    if (e.classList.contains(className)) e.classList.remove(className);
  }
}

/**
 * Alterna l'applicazione della classe sul body
 * @param doc
 * @param cl1
 * @param cl2
 * @param handler
 */
export const toggleBodyClass = (doc: Document, cl1: string, cl2: string, handler?: (ac: string) => void) => {
  if (doc.body.classList.contains(cl1)) {
    doc.body.classList.replace(cl1, cl2);
    if (handler) handler(cl2);
  } else {
    doc.body.classList.replace(cl2, cl1);
    if (handler) handler(cl1);
  }
}

export const toggleBodyClass2 = (doc: Document, cl_true: string, cl_false: string, apply = true) => {
  if (apply) {
    doc.body.classList.replace(cl_false, cl_true);
  } else {
    doc.body.classList.replace(cl_true, cl_false);
  }
}


export const setBodyClass = (doc: Document, clin: string, clout: string) => {
  doc.body.classList.replace(clout, clin);
}


export const clearObject = (o?: any) => {
  if (!o) return;
  for (const m in o) delete o[m];
}


export const breakOn = (condition: () => boolean) => {
  if (condition()) {
    debugger;
  }
}

export const getTypedValue = (v: any, type?: ValueType): any => {
  switch (type) {
    case 'string': return `${v||''}`;
    case 'integer': return parseInt(`${v||0}`, 10);
    case 'number': return parseFloat(`${v||0}`);
    default: return v;
  }
}

export const isJsonType = (type: string): boolean => type === 'application/json';

export const getFirstJsonFile = (files: any) => {
  return Array.from(files||[]).find((i: any) => isJsonType(i?.type));
}

export const stopEvent = (e: any) => {
  if (_isFunction(e?.preventDefault)) e.preventDefault();
  if (_isFunction(e?.stopPropagation)) e.stopPropagation();
}

export const combine = (...paths: string[]) => {
  return paths.join('/').replace(/[^:]\/{2,}/g, '/');
}


export const scrollToElement = (doc: Document, id: string, position: ScrollLogicalPosition = 'center') => {
  const ele = doc.getElementById(id);
  if (ele) {
    ele.scrollIntoView({
      behavior: 'smooth',
      block: position,
      inline: 'nearest'
    });
  }
}
