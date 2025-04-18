import { HLParser } from './model';
import { Highlights } from '../highlights';
import { parseCell, parseGroup, parsePath } from './parser.helper';
import { GroupType } from '../consts';

const HLColumnParser: HLParser = {
  name: 'column',
  rgx: /^col\s/g,
  parse: (hl: Highlights, l: string) => parseGroup(hl, l, 'col', GroupType.column)
}
const HLRowParser: HLParser = {
  name: 'row',
  rgx: /^row\s/g,
  parse: (hl: Highlights, l: string) => parseGroup(hl, l, 'row', GroupType.row)
}
const HLSquareParser: HLParser = {
  name: 'square',
  rgx: /^sqr\s|^grp\s/g,
  parse: (hl: Highlights, l: string) => parseGroup(hl, l, 'sqr', GroupType.square)
}
const HLMainCellParser: HLParser = {
  name: 'main cell',
  rgx: /^cell\s/g,
  parse: (hl: Highlights, l: string) => parseCell(hl, l, 'cell', 'cell')
}
const HLSecondaryCellParser: HLParser = {
  name: 'secondary cell',
  rgx: /^cell2\s/g,
  parse: (hl: Highlights, l: string) => parseCell(hl, l, 'cell2', 'secondaryCell')
}
const HLValueParser: HLParser = {
  name: 'value',
  rgx: /^value\s/g,
  parse: (hl: Highlights, l: string) => parseCell(hl, l, 'value', 'cellValue')
}
const HLPathParser: HLParser = {
  name: 'path',
  rgx: /^path\s/g,
  parse: (hl: Highlights, l: string) => parsePath(hl, l, 'path')
}


export const HLPARSERS: HLParser[] = [
  HLColumnParser,
  HLRowParser,
  HLSquareParser,
  HLMainCellParser,
  HLSecondaryCellParser,
  HLValueParser,
  // HLPathParser
];


export const parseHLLine = (hl: Highlights, l: string) => {
  const parser = HLPARSERS.find(p => {
    p.rgx.lastIndex = 0;
    return p.rgx.test(l);
  });
  if (parser) parser.parse(hl, l);
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
