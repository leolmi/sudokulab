import {Dictionary} from "@ngrx/entity";
import {EditSudokuOptions} from "./EditSudokuOptions";
import {EditSudokuCell} from "./EditSudokuCell";
import {EditSudokuGroup} from "./EditSudokuGroup";
import {cellId, getGroupRank, groupId} from "../sudoku-helper";
import {SudokuGroupType} from "./enums";

export class EditSudoku {
  constructor(es?: Partial<EditSudoku>) {
    this.id = `${performance.now()}`;
    this.cells = {};
    this.groups = {};
    this.groupsForCell = {};
    Object.assign(this, es || {});
    this.options = new EditSudokuOptions(es?.options);
    _loadSudoku(this);
  }
  id: string;
  options: EditSudokuOptions;
  cells: Dictionary<EditSudokuCell>;
  groups: Dictionary<EditSudokuGroup>;
  groupsForCell: Dictionary<(EditSudokuGroup|undefined)[]>;
}

const _addGroup = (es: EditSudoku, type: SudokuGroupType, pos: number) => {
  const gid = groupId(type, pos);
  es.groups[gid] = new EditSudokuGroup({ id: gid });
}

const _loadSudoku = (es: EditSudoku) => {
  es.groups = {};
  es.cells = {};
  // genera i gruppi
  for(let g = 0; g < es.options.rank; g++) {
    _addGroup(es, SudokuGroupType.row, g);
    _addGroup(es, SudokuGroupType.column, g);
    _addGroup(es, SudokuGroupType.square, g);
  }
  // genera le celle & popola i gruppi
  for(let r = 0; r < es.options.rank; r++) {
    for(let c = 0; c < es.options.rank; c++) {
      const x = (r * es.options.rank) + c;
      const cid = cellId(c, r);
      const cell = new EditSudokuCell({
        id: cid,
        position: x
      });
      es.cells[cid] = cell;
      const grank = getGroupRank(es.options.rank);
      const gpos = Math.floor(r / grank) * grank + Math.floor(c / grank);
      es.groupsForCell[cell.id] = [
        es.groups[groupId(SudokuGroupType.row, r)],
        es.groups[groupId(SudokuGroupType.column, c)],
        es.groups[groupId(SudokuGroupType.square, gpos)]
      ];
      es.groupsForCell[cell.id]?.forEach(g => g?.cells.push(cell));
    }
  }
}
