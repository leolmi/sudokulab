/**
 * mappa degli identificativi delle celle
 */
export type IdMap = { [id: string]: boolean };

/**
 * mappa dei valori sulle celle
 */
export type ValuesMap = { [value: string]: IdMap }

/**
 * condizione generica
 */
export type Condition = (...args: any[]) => boolean;

/**
 * dizionario tipizzato
 */
export type Dictionary<T> = { [key: string]: T; }

/**
 * tipologie basiche di dato
 */
export type ValueType = 'string'|'integer'|'number';

/**
 * colori disponibili per le voci di menu
 */
export type MenuItemColor = 'error'|'warning'|'success'|'accent'|'secondary';
