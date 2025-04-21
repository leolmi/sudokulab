import { getCoord } from '../../model.helper';
import { keys as _keys } from 'lodash';
import { GROUP, SEPARATOR, SEPARATOR2 } from './model';
import { Highlights } from '../highlights';


export const getValues = (l?: string) => (l||'').split(SEPARATOR).filter(v => !!v);

export const onValues = (l: string, prefix: string, handler: (vls: string[]) => void) => {
  const ls = l.substring(prefix.length);
  const vls = ls.split(SEPARATOR2);
  vls.forEach(vl => {
    const hvs = `${vl||''}`.trim().split(SEPARATOR);
    handler(hvs);
  });
}


/**
 * codifica gli highlights nella corrispondente stringa
 * @param h
 */
export const encodeHighlights = (h: Partial<Highlights>): string => {
  let output: string[] = [];
  _keys(h.cell).forEach(cid => output.push(`cell ${getCoord(cid)}`));
  (h.groups||[]).forEach(g => output.push(`${GROUP[g.type]} ${g.pos+1}`));
  _keys(h.cellValue).forEach(cid => output.push(`value ${getCoord(cid)}`));
  _keys(h.secondaryCell)
    .filter(cid => !(h.cell||{})[cid])
    .forEach(cid => output.push(`cell2 ${getCoord(cid)}`));
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
