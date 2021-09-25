import { Dictionary } from '@ngrx/entity';
import { EditSudokuOptions } from './EditSudokuOptions';
import { EditSudokuCell } from './EditSudokuCell';
import { EditSudokuGroup } from './EditSudokuGroup';
import { cellId, getGroupRank, groupId, isValue } from '../sudoku.helper';
import { SudokuGroupType } from './enums';
import { remove as _remove } from 'lodash';
import { SDK_PREFIX, SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE } from './consts';

export class GenerationMapCellInfo {
  constructor(sdk: EditSudoku, cell: EditSudokuCell) {
    this.id = cell.id;
    this.isValueX = [SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE].indexOf(sdk.originalSchema?.charAt(cell.position)||'')>-1;
    this.index = -1;
  }
  id: string;
  isValueX: boolean;
  index: number;
}

export class EditSudokuGenerationMap {
  constructor(sdk: EditSudoku) {
    this.cellsX = {};
    this.fixedCells = sdk.fixed.map(fc => new GenerationMapCellInfo(sdk, fc));
    this.fixedCellsX = this.fixedCells.filter(c => c.isValueX);
    this.fixedCellsX.forEach(cx => this.cellsX[cx.id] = cx);
  }
  cellsX: Dictionary<GenerationMapCellInfo>;
  fixedCells: GenerationMapCellInfo[];
  fixedCellsX: GenerationMapCellInfo[];
}

export class EditSudoku {
  constructor(es?: Partial<EditSudoku>) {
    this.id = `${performance.now()}`;
    this.cells = {};
    this.cellList = [];
    this.fixed = [];
    this.groups = {};
    this.groupsForCell = {};
    this.fixedCount = 0;
    Object.assign(this, es || {});
    this.options = new EditSudokuOptions(es?.options);
    _loadSudoku(this);
    this.valorizations = {};
  }
  id: string;
  options: EditSudokuOptions;
  fixedCount: number;
  fixed: EditSudokuCell[];
  cells: Dictionary<EditSudokuCell>;
  cellList: EditSudokuCell[];
  groups: Dictionary<EditSudokuGroup>;
  groupsForCell: Dictionary<(EditSudokuGroup|undefined)[]>;
  originalSchema?: string;
  generationMap?: EditSudokuGenerationMap;
  valorizations: Dictionary<boolean>;

  checkFixedCell(cell: EditSudokuCell) {
    if (!!cell.value && !cell.fixed) {
      cell.fixed = true;
      this.fixedCount++;
      this.fixed.push(cell);
    } else if (!cell.value && !!cell.fixed) {
      cell.fixed = false;
      this.fixedCount--;
      _remove(this.fixed, c => c.id === cell.id);
    }
  }

  load(fixedValues: string) {
    const fixed = (fixedValues || '').trim().replace(/\s/g, '');
    if (fixed.length <= this.options.rank) return console.warn(...SDK_PREFIX, 'Cannot load schema', fixedValues);
    for (let i = 0; i < fixed.length; i++) {
      const v = fixed.charAt(i);
      const cell = this.cellList[i];
      cell.value = isValue(v, true) ? v : '';
      this.checkFixedCell(cell);
    }
  }
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
      es.cellList.push(cell);
      es.checkFixedCell(cell);
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
