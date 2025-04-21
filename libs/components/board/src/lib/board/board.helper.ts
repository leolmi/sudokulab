import { cloneDeep as _clone, isObject as _isObject, isString as _isString, keys as _keys } from 'lodash';
import {
  AVAILABLE_DIRECTIONS,
  BoardCell,
  BoardNextMode,
  BoardStatus,
  DELETE_KEY,
  GEOMETRY,
  MoveDirection,
  SKIPPED_KEYS
} from './board.model';
import {
  AlgorithmResult,
  buildSudokuCells,
  Cell,
  cellCoord,
  cellId,
  decodeCellId,
  decodeHighlightsString,
  decodeSdkString,
  DEFAULT_RANK,
  encodeSdkString,
  forEachCell,
  getStandardValue,
  groupId,
  isDynamicChar,
  LogicWorkerData,
  STANDARD_CHARACTERS,
  Sudoku,
  SudokuCell,
  SudokuEx,
  SudokuInfoEx,
  UserValues
} from '@olmi/model';
import { nextInRow, nextInSquare, nextPrev } from './board.internal';


export const onCell = (cells: BoardCell[], cell: Cell|undefined|null, handler: (cell: BoardCell) => any) => {
  const xc = cells.find(c => c.row === cell?.row && c.col === cell?.col);
  if (xc) handler(xc);
}

/**
 * aggiunge le informazioni essenziali per la board alle celle
 * @param cls
 * @param check
 * @param uv
 */
export const parseCells = (cls?: SudokuCell[]|undefined|null, check = false, uv?: UserValues): BoardCell[] => {
  const eff_cls: BoardCell[] = [];
  forEachCell((c, ci) => {
    const xc = (cls || []).find(cc => cc.col == c.col && cc.row === c.row);
    const x = c.col * GEOMETRY.cell.width;
    const y = c.row * GEOMETRY.cell.height;
    if (xc || !check) {
      const bc = new BoardCell({
        ...xc,
        ...c,
        x,
        y,
        textX: x + (GEOMETRY.cell.width / 2),
        textY: y + (GEOMETRY.cell.height / 2),
        id: cellId(c.col, c.row)
      });
      if (!bc.isFixed && (uv?.uv||'').charAt(ci)) bc.text = getCellValue((uv?.uv||'').charAt(ci));
      if (uv && uv.cv[bc.coord]) bc.userValues = uv.cv![bc.coord]||[];
      eff_cls.push(bc);
    }
  })
  return eff_cls;
}

export const isDirectionKey = (code: string): boolean => {
  return _keys(AVAILABLE_DIRECTIONS).indexOf(code)>-1;
}

export const isSkippedKey = (code: string): boolean => SKIPPED_KEYS[code];

export const isDeleteKey = (code: string): boolean => code===DELETE_KEY;

export const isCopyKeys = (e: KeyboardEvent): boolean => (e.key==='c' && e.ctrlKey) || e.key === 'Copy';

export const isPasteKeys = (e: KeyboardEvent): boolean => (e.key==='v' && e.ctrlKey) || e.key === 'Paste';

export const moveOnDirection = (direction: string, current?: Cell|undefined|null, mode?: BoardNextMode): Cell => {
  const rank = DEFAULT_RANK;
  const cell: Cell = { row: current?.row||0, col: current?.col||0 }
  switch (AVAILABLE_DIRECTIONS[direction]||MoveDirection.next) {
    case MoveDirection.up:
      cell.row = (cell.row <= 0) ? rank - 1 : cell.row - 1;
      break;
    case MoveDirection.down:
      cell.row = (cell.row >= rank - 1) ? 0 : cell.row + 1;
      break;
    case MoveDirection.left:
      cell.col = (cell.col <= 0) ? rank - 1 : cell.col - 1;
      break;
    case MoveDirection.right:
      cell.col = (cell.col >= rank - 1) ? 0 : cell.col + 1;
      break;
    case MoveDirection.prev:
      nextPrev(cell, rank);
      break;
    case MoveDirection.next:
    default:
      switch (mode) {
        case 'none':
          break;
        case 'next-in-square':
          nextInSquare(cell, rank);
          break;
        case 'next-in-row':
        default:
          nextInRow(cell, rank);
          break;
      }
      break;
  }
  return cell;
}

export const getCellValue = (v?: string, status?: BoardStatus): string => {
  switch (status?.editMode) {
    case 'schema':
      return (isDynamicChar(v) && status?.isDynamic) ?
        STANDARD_CHARACTERS.dynamic :
        getStandardValue(v);
    default:
      return getStandardValue(v);
  }

}

export const buildSchemaBoard = (v?: string): BoardCell[] => {
  return buildSudokuCells(v).map(sc => new BoardCell(sc));
}

/**
 * restituisce le celle per la griglia
 * @param source
 * @param preview
 * @param uv
 */
export const getBoardCells = (source: Sudoku|SudokuEx|string|null|undefined, preview = false, uv?: UserValues): BoardCell[] => {
  let cells: SudokuCell[] = [];
  if (_isString(source)) {
    cells = buildSudokuCells(`${source||''}`, { onlyValues: preview });
  } else if (_isObject(source)) {
    if (((<SudokuEx>source)?.cells||[]).length>0) {
      cells = _clone(((<SudokuEx>source)?.cells || []).filter(c => !preview || c.isFixed));
    } else {
      cells = buildSudokuCells(`${(<Sudoku>source)?.values||''}`, { onlyValues: preview });
    }
  }
  return parseCells(<BoardCell[]>cells, true, uv);
}

export class Coding {
  static encode = encodeSdkString;
  static decode = decodeSdkString;
  static cellId = cellId;
  static cellCoord = cellCoord;
  static decodeCellId = decodeCellId;
  static groupId = groupId;
  static decodeHighlightsString = decodeHighlightsString
}

export const getSequence = (data: LogicWorkerData): AlgorithmResult[] => {
  const infoex = <SudokuInfoEx>data.sudoku?.info;
  return (infoex?.solution||[]).map(r => <AlgorithmResult>{
    ...r,
    allowHidden:data.allowHidden
  });
}
