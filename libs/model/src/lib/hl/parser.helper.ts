import { Highlights } from '../highlights';
import { DEFAULT_RANK, GroupType } from '../consts';
import { decodeCellId, getCellId, groupId } from '../../model.helper';
import { SudokuGroup } from '../sudoku-group';
import { onValues } from './helper';
import { Cell } from '../cell';


export const parseGroup =  (hl: Highlights, l: string, prefix: string, type: GroupType) => {
  onValues(l, prefix, (values) => {
    const upos = (type === GroupType.row && /[a-iA-I]/g.test(values[0])) ?
      'abcdefghi'.indexOf(values[0].toLowerCase()) + 1 :
      parseInt(values[0], 10);
    const pos = upos - 1;
    const color = values[1];
    const id = groupId(type, pos);
    if (pos > -1 && pos < DEFAULT_RANK && !hl.groups.find(g => g.id === id)) {
      hl.groups = hl.groups || [];
      hl.groups.push(new SudokuGroup({ id, type, pos }));
    }
  })
}

export const parseCell = (hl: Highlights, l: string, prefix: string, target: 'cell'|'secondaryCell'|'cellValue') => {
  onValues(l, prefix, (values) => {
    const cell = decodeCellId(values[0]);
    if (!cell) return;
    const color = values[1];
    const id = getCellId(cell);
    (<any>hl)[target][id] = color || true;
  });
}

export const parsePath = (hl: Highlights, l: string, prefix: string) => {
  onValues(l, prefix, (values) => {
    const paths = <Cell[]>values
      .map(l => decodeCellId(l))
      .filter(c => !!c);
    hl.paths.push(paths);
  });
}

