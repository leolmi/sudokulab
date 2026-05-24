import { HLParser } from './model';
import { Highlights } from '../highlights';
import { parseCell, parseGroup, parsePath } from './parser.helper';
import { GroupType } from '../consts';

// Sintassi prefisso: `name` oppure `name:color` (con color senza whitespace),
// seguito da whitespace prima del body. Il colore è "puro" (es. `red`,
// `#4064ff`); la trasparenza è applicata in fase di rendering.
const HLColumnParser: HLParser = {
  name: 'column',
  rgx: /^col(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseGroup(hl, body, GroupType.column, color)
}
const HLRowParser: HLParser = {
  name: 'row',
  rgx: /^row(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseGroup(hl, body, GroupType.row, color)
}
const HLSquareParser: HLParser = {
  name: 'square',
  rgx: /^(?:sqr|grp)(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseGroup(hl, body, GroupType.square, color)
}
const HLMainCellParser: HLParser = {
  name: 'main cell',
  rgx: /^cell(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseCell(hl, body, 'cell', color)
}
const HLSecondaryCellParser: HLParser = {
  name: 'secondary cell',
  rgx: /^cell2(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseCell(hl, body, 'secondaryCell', color)
}
const HLValueParser: HLParser = {
  name: 'value',
  rgx: /^value(?::(\S+))?\s+/,
  parse: (hl, body, color) => parseCell(hl, body, 'cellValue', color)
}
const HLPathParser: HLParser = {
  name: 'path',
  rgx: /^path\s+/,
  parse: (hl, body) => parsePath(hl, body)
}


export const HLPARSERS: HLParser[] = [
  // cell2 prima di cell per evitare ambiguità sull'ordine di scansione
  HLSecondaryCellParser,
  HLMainCellParser,
  HLColumnParser,
  HLRowParser,
  HLSquareParser,
  HLValueParser,
  // HLPathParser
];


export const parseHLLine = (hl: Highlights, l: string) => {
  for (const p of HLPARSERS) {
    p.rgx.lastIndex = 0;
    const m = p.rgx.exec(l);
    if (m) {
      p.parse(hl, l.substring(m[0].length), m[1]);
      return;
    }
  }
}

/**
 * decodifica la stringa in un set di highlights
 * @param s
 */
export const decodeHighlightsString = (s?: string): Highlights => {
  const lines = (s||'').split('\n').map(r => r.trim());
  const hl = new Highlights();
  lines.forEach(l => parseHLLine(hl, l));
  return hl;
}
