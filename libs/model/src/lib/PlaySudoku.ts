import { Sudoku } from './Sudoku';
import { PlaySudokuCell } from './PlaySudokuCell';
import { PlaySudokuGroup } from './PlaySudokuGroup';
import { SudokuGroupType } from './enums';
import { PlaySudokuOptions } from './PlaySudokuOptions';
import { Dictionary } from '@ngrx/entity';
import { PlaySudokuState } from './PlaySudokuState';
import { cellId, getAvailables, getGroupRank, groupId } from '../sudoku.helper';
import { SUDOKU_EMPTY_VALUE } from './consts';

export class PlaySudoku {
  constructor(ps?: Partial<PlaySudoku>) {
    this._id = ps?.sudoku?._id || 0;
    this.cells = {};
    this.groups = {};
    this.groupsForCell = {};
    this.couples = {};
    Object.assign(this, ps || {});
    this.options = new PlaySudokuOptions(ps?.options);
    this.state = new PlaySudokuState(ps?.state);
    _loadSudoku(this);
  }
  _id: number;
  options: PlaySudokuOptions;
  sudoku?: Sudoku;
  cells: Dictionary<PlaySudokuCell>;
  groups: Dictionary<PlaySudokuGroup>;
  groupsForCell: Dictionary<(PlaySudokuGroup|undefined)[]>;
  couples: Dictionary<PlaySudokuCell[]>;
  state: PlaySudokuState;
}

const _addGroup = (ps: PlaySudoku, type: SudokuGroupType, pos: number) => {
  const gid = groupId(type, pos);
  ps.groups[gid] = new PlaySudokuGroup({ id: gid });
}

const _getValue = (v: string): string => (v||SUDOKU_EMPTY_VALUE) === SUDOKU_EMPTY_VALUE ? '' : v;

const _loadSudoku = (ps: PlaySudoku) => {
  if (!ps?.sudoku) return;
  ps.groups = {};
  ps.cells = {};
  ps.state.fixedCount = 0;
  ps.state.valuesCount = 0;
  // group rank (9 => 3)
  const grank = getGroupRank(ps.sudoku.rank);
  // genera i gruppi
  for(let g = 0; g < ps.sudoku.rank; g++) {
    _addGroup(ps, SudokuGroupType.row, g);
    _addGroup(ps, SudokuGroupType.column, g);
    _addGroup(ps, SudokuGroupType.square, g);
  }
  // genera le celle & popola i gruppi
  for(let r = 0; r < ps.sudoku.rank; r++) {
    for(let c = 0; c < ps.sudoku.rank; c++) {
      const x = (r * ps.sudoku.rank) + c;
      const cv = (ps.sudoku?.values||'')[x];
      const fv = (ps.sudoku?.fixed||'')[x];
      const cid = cellId(c, r);
      const empty = !((fv || SUDOKU_EMPTY_VALUE) !== SUDOKU_EMPTY_VALUE || (cv || SUDOKU_EMPTY_VALUE) !== SUDOKU_EMPTY_VALUE);
      const cell = new PlaySudokuCell({
        id: cid,
        position: x,
        value: _getValue(cv),
        fixed: (fv || SUDOKU_EMPTY_VALUE) !== SUDOKU_EMPTY_VALUE,
        availables: empty ? getAvailables(ps.sudoku?.rank) : []
      });
      if (cell.fixed) ps.state.fixedCount++;
      if (!!cell.value) ps.state.valuesCount++;
      ps.cells[cid] = cell;
      const gpos = Math.floor(r / grank) * grank + Math.floor(c / grank);
      ps.groupsForCell[cell.id] = [
        ps.groups[groupId(SudokuGroupType.row, r)],
        ps.groups[groupId(SudokuGroupType.column, c)],
        ps.groups[groupId(SudokuGroupType.square, gpos)]
      ];
      ps.groupsForCell[cell.id]?.forEach(g => g?.cells.push(cell));
    }
  }
}
