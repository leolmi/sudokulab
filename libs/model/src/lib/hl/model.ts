import { Highlights } from '../highlights';
import { GroupType } from '../consts';

export const SEPARATOR = ' ';
export const SEPARATOR2 = ',';
export const GROUP: any = {
  [GroupType.square]: 'sqr',
  [GroupType.column]: 'col',
  [GroupType.row]: 'row'
}

/**
 * Parser di una singola riga di highlights. La `rgx` deve catturare nel primo
 * gruppo opzionale il colore (se la riga lo specifica nella forma
 * `prefix:color`); `parse` riceve già il `body` (riga senza il prefisso) e
 * l'eventuale colore estratto.
 */
export type HLParser = { name: string, rgx: RegExp, parse: (hl: Highlights, body: string, color?: string) => void };
