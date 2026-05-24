import { getCoord } from '../../model.helper';
import { keys as _keys } from 'lodash';
import { GROUP, SEPARATOR } from './model';
import { Highlights } from '../highlights';


export const getValues = (l?: string) => (l||'').split(SEPARATOR).filter(v => !!v);

// I valori sono identificatori alfanumerici puri (es. `B4`, `4`, `A`).
// Qualunque sequenza di caratteri non alfanumerici fa da separatore: spazio,
// virgola, punto, punto e virgola, tab, ecc. — così l'utente può separare
// in modo libero senza badare alla grammatica.
const TOKEN_SPLIT_RX = /[^a-zA-Z0-9]+/;

/**
 * Estrae tutti i valori dal `body` (riga già privata del prefisso) e li passa
 * al handler come un unico array. Il handler decide se trattarli come singoli
 * (cell/group) o come collezione (path).
 */
export const onValues = (body: string, handler: (vls: string[]) => void) => {
  const tokens = body.split(TOKEN_SPLIT_RX).filter(t => !!t);
  if (tokens.length > 0) handler(tokens);
}

// suffisso `:color` se il valore è una stringa (colore custom)
const colorSuffix = (v: any): string => (typeof v === 'string' && v) ? `:${v}` : '';


/**
 * codifica gli highlights nella corrispondente stringa
 * @param h
 */
export const encodeHighlights = (h: Partial<Highlights>): string => {
  const output: string[] = [];
  _keys(h.cell).forEach(cid => output.push(`cell${colorSuffix((h.cell as any)[cid])} ${getCoord(cid)}`));
  (h.groups||[]).forEach(g => output.push(`${GROUP[g.type]}${colorSuffix(g.color)} ${g.pos+1}`));
  _keys(h.cellValue).forEach(cid => output.push(`value${colorSuffix((h.cellValue as any)[cid])} ${getCoord(cid)}`));
  _keys(h.secondaryCell)
    .filter(cid => !(h.cell||{})[cid])
    .forEach(cid => output.push(`cell2${colorSuffix((h.secondaryCell as any)[cid])} ${getCoord(cid)}`));
  (h.paths||[]).forEach(cells => `path ${cells.map(c => getCoord(c)).join(' ')}`);

  return output.join('\n');
}

/**
 * costruisce la classe degli highlights comprensiva del codice
 * @param h
 */
export const buildHighlights = (h: Partial<Highlights>): Highlights => {
  const hl = new Highlights(h);
  hl.code = encodeHighlights(h);
  return hl;
}
