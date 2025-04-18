import { Highlights } from '../highlights';
import { GroupType } from '../consts';

export const SEPARATOR = ' ';
export const SEPARATOR2 = ',';
export const GROUP: any = {
  [GroupType.square]: 'sqr',
  [GroupType.column]: 'col',
  [GroupType.row]: 'row'
}

export type HLParser = { name: string, rgx: RegExp, parse: (hl: Highlights, l: string) => void };
