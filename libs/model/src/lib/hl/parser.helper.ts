import { Highlights } from '../highlights';
import { DEFAULT_RANK, GroupType } from '../consts';
import { decodeCellId, getCellId, groupId } from '../../model.helper';
import { SudokuGroup } from '../sudoku-group';
import { onValues } from './helper';
import { Cell } from '../cell';


export const parseGroup = (hl: Highlights, body: string, type: GroupType, color?: string) => {
  onValues(body, (values) => {
    values.forEach(v => {
      const upos = (type === GroupType.row && /[a-iA-I]/.test(v)) ?
        'abcdefghi'.indexOf(v.toLowerCase()) + 1 :
        parseInt(v, 10);
      const pos = upos - 1;
      const id = groupId(type, pos);
      if (pos > -1 && pos < DEFAULT_RANK && !hl.groups.find(g => g.id === id)) {
        hl.groups = hl.groups || [];
        hl.groups.push(new SudokuGroup({ id, type, pos, color }));
      }
    });
  })
}

export const parseCell = (hl: Highlights, body: string, target: 'cell'|'secondaryCell'|'cellValue', color?: string) => {
  onValues(body, (values) => {
    values.forEach(v => {
      const cell = decodeCellId(v);
      if (!cell) return;
      const id = getCellId(cell);
      (<any>hl)[target][id] = color || true;
    });
  });
}

export const parsePath = (hl: Highlights, body: string) => {
  onValues(body, (values) => {
    const paths = <Cell[]>values
      .map(l => decodeCellId(l))
      .filter(c => !!c);
    if (paths.length > 0) hl.paths.push(paths);
  });
}

