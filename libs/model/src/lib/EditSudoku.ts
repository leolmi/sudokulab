import { Dictionary } from '@ngrx/entity';
import { EditSudokuOptions } from './EditSudokuOptions';
import { EditSudokuCell } from './EditSudokuCell';
import { EditSudokuGroup } from './EditSudokuGroup';
import { applySudokuRules, cellId, getAvailables, getGroupRank, groupId } from '../sudoku.helper';
import { SudokuGroupType } from './enums';
import { remove as _remove } from 'lodash';
import { SDK_PREFIX, SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE } from './consts';
import { guid, isValue } from '../global.helper';

/**
 * Informazioni di cella per il generatore
 */
export class GenerationMapCellInfo {
  constructor(sdk: EditSudoku, cid: string) {
    this.id = cid;
    const position = sdk.cells[cid]?.position||0;
    const original_char = sdk.originalSchema?.charAt(position)||'';
    this.isValueX = [SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE].indexOf(original_char)>-1;
    this.index = -1;
  }

  /**
   * Identificativo della cella a cui riferisce
   */
  id: string;
  /**
   * Vero se NON è un valore fisso reale
   * (quindi se è "0" o "?"))
   */
  isValueX: boolean;
  /**
   * Posizione di lettura degli available
   */
  index: number;
}

/**
 * Mappa per il generatore
 */
export class EditSudokuGenerationMap {
  constructor(sdk: EditSudoku) {
    this.cellsX = {};
    this.fixedCells = sdk.fixed.map(fcid => new GenerationMapCellInfo(sdk, fcid));
    this.fixedCells.forEach(c => c.isValueX ? this.cellsX[c.id] = true : null);
  }

  /**
   * Dizionario delle celle dinamiche
   */
  cellsX: Dictionary<boolean>;
  /**
   * Tutte le celle fisse (dinamiche e non)
   */
  fixedCells: GenerationMapCellInfo[];
}

export class EditSudoku {
  constructor(es?: Partial<EditSudoku>) {
    this.cells = {};
    this.cellList = [];
    this.fixed = [];
    this.fixedMap = {};
    this.groups = {};
    this.groupsForCell = {};
    this.fixedCount = 0;
    Object.assign(this, es || {});
    this.id = guid();
    this.options = new EditSudokuOptions(es?.options);
    _loadSudoku(this, es);
    this.valorizations = {};
  }
  id: string;
  options: EditSudokuOptions;
  fixedCount: number;
  fixed: string[];
  fixedMap: Dictionary<boolean>;
  cells: Dictionary<EditSudokuCell>;
  cellList: string[];
  groups: Dictionary<EditSudokuGroup>;
  groupsForCell: Dictionary<string[]>;
  originalSchema?: string;
  generationMap?: EditSudokuGenerationMap;
  valorizations: Dictionary<boolean>;

  checkFixedCell(cell: EditSudokuCell) {
    if (!!cell.value && !cell.fixed) {
      cell.fixed = true;
      if (!this.fixedMap[cell.id]) {
        this.fixedCount++;
        this.fixed.push(cell.id);
        this.fixedMap[cell.id] = true;
      }
    } else if (!cell.value && cell.fixed) {
      cell.fixed = false;
      if (this.fixedMap[cell.id]) {
        delete this.fixedMap[cell.id];
        _remove(this.fixed, cid => cid === cell.id);
        this.fixedCount--;
      }
    }
  }

  load(fixedValues: string) {
    const fixed = (fixedValues || '').trim().replace(/\s/g, '');
    if (fixed.length <= this.options.rank) return console.warn(...SDK_PREFIX, 'Cannot load schema', fixedValues);
    for (let i = 0; i < fixed.length; i++) {
      const v = fixed.charAt(i);
      const cid = this.cellList[i];
      const cell = this.cells[cid];
      if (cell) {
        cell.value = isValue(v, true) ? v : '';
        this.checkFixedCell(cell);
      }
    }
    applySudokuRules(this, true);
  }
}

const _addGroup = (es: EditSudoku, type: SudokuGroupType, pos: number) => {
  const gid = groupId(type, pos);
  es.groups[gid] = new EditSudokuGroup({ id: gid });
}

const _loadSudoku = (es: EditSudoku, esx?: Partial<EditSudoku>) => {
  es.fixed = [];
  es.groups = {};
  es.cells = {};
  es.cellList = [];
  es.groupsForCell = {};
  es.generationMap = undefined;
  es.fixedCount = 0;
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
        position: x,
        value: (esx?.cells||{})[cid]?.value||'',
        availables: getAvailables(es.options.rank)
      });
      es.cells[cid] = cell;
      es.cellList.push(cell.id);
      es.checkFixedCell(cell);
      const grank = getGroupRank(es.options.rank);
      const gpos = Math.floor(r / grank) * grank + Math.floor(c / grank);
      es.groupsForCell[cell.id] = [
        groupId(SudokuGroupType.row, r),
        groupId(SudokuGroupType.column, c),
        groupId(SudokuGroupType.square, gpos)
      ];
      es.groupsForCell[cell.id]?.forEach(gid => es.groups[gid]?.cells.push(cell.id));
    }
  }
  checkEditAvailables(es);
}

const checkEditAvailables = (es: EditSudoku) => {
  if (!es) return;
  // aaplica le regole base del sudoku
  applySudokuRules(es);
}
