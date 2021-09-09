import { Sudoku } from './Sudoku';
import { PlaySudokuCell } from './PlaySudokuCell';
import { PlaySudokuGroup } from './PlaySudokuGroup';
import { PlaySudokuGroupType } from './enums';
import { PlaySudokuOptions } from './PlaySudokuOptions';
import { Dictionary } from '@ngrx/entity';
import { PlaySudokuState } from './PlaySudokuState';
import { cellId, getAvailables, getGroupRank, groupId } from '../sudoku-helper';

export class PlaySudoku {
  constructor(ps?: Partial<PlaySudoku>) {
    this.id = ps?.sudoku?.id || `${performance.now()}`;
    this.sudoku = undefined;
    this.cells = {};
    this.groups = {};
    this.groupsForCell = {};
    this.couples = {};
    Object.assign(this, ps || {});
    this.options = new PlaySudokuOptions(ps?.options);
    this.state = new PlaySudokuState(ps?.state);
    _loadSudoku(this);
  }
  id: string;
  options: PlaySudokuOptions;
  sudoku: Sudoku|undefined;
  cells: Dictionary<PlaySudokuCell>;
  groups: Dictionary<PlaySudokuGroup>;
  groupsForCell: Dictionary<(PlaySudokuGroup|undefined)[]>;
  couples: Dictionary<PlaySudokuCell[]>;
  state: PlaySudokuState;
}

const _addGroup = (ps: PlaySudoku, type: PlaySudokuGroupType, pos: number) => {
  const gid = groupId(type, pos);
  ps.groups[gid] = new PlaySudokuGroup({ id: gid });
}

const _getValue = (v: string): string => (v||'0') === '0' ? '' : v;

const _loadSudoku = (ps: PlaySudoku) => {
  if (!ps?.sudoku) return;
  ps.groups = {};
  ps.cells = {};
  ps.state.fixedCount = 0;
  ps.state.valuesCount = 0;
  // group rank (9 => 3)
  const grank = getGroupRank(ps.sudoku);
  // genera i gruppi
  for(let g = 0; g < ps.sudoku.rank; g++) {
    _addGroup(ps, PlaySudokuGroupType.row, g);
    _addGroup(ps, PlaySudokuGroupType.column, g);
    _addGroup(ps, PlaySudokuGroupType.square, g);
  }
  // genera le celle & popola i gruppi
  for(let r = 0; r < ps.sudoku.rank; r++) {
    for(let c = 0; c < ps.sudoku.rank; c++) {
      const x = (r * ps.sudoku.rank) + c;
      const cv = (ps.sudoku?.values||'')[x];
      const fv = (ps.sudoku?.fixed||'')[x];
      const cid = cellId(c, r);
      const empty = !((fv || '0') !== '0' || (cv || '0') !== '0');
      const cell = new PlaySudokuCell({
        id: cid,
        position: x,
        value: _getValue(cv),
        fixed: (fv || '0') !== '0',
        availables: empty ? getAvailables(ps) : []
      });
      if (cell.fixed) ps.state.fixedCount++;
      if (!!cell.value) ps.state.valuesCount++;
      ps.cells[cid] = cell;
      const gpos = Math.floor(r / grank) * grank + Math.floor(c / grank);
      ps.groupsForCell[cell.id] = [
        ps.groups[groupId(PlaySudokuGroupType.row, r)],
        ps.groups[groupId(PlaySudokuGroupType.column, c)],
        ps.groups[groupId(PlaySudokuGroupType.square, gpos)]
      ];
      ps.groupsForCell[cell.id]?.forEach(g => g?.cells.push(cell));
    }
  }

  console.log('PLAY SUDOKU', ps);
}
