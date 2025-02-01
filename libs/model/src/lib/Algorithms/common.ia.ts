import {cellId, getGroupsByType, isEmptyCell, PlaySudoku, SudokuGroupType} from "@sudokulab/model";

export interface Cell {
  candidates: number[];
  col: number;
  row: number;
}

export type Group = Cell[];
export type Grid = Group[];

export type GroupType  = 'row'|'col';

export type Unit = Cell[];

export interface Change {
  cell: Cell;
  removed: string[];
  cells: Cell[];
}


export const sdkToGrid = (sdk: PlaySudoku): Grid => {
  const grid: Grid = [];
  getGroupsByType(sdk, SudokuGroupType.row).forEach((r, rowIndex) => {
    const cells = r.cells.map((cid, colIndex) => {
      const cell = sdk.cells[cid];
      return <Cell>{
        candidates: (cell!.fixed || !!cell!.value) ? [parseInt(cell!.value)] : cell!.availables.map(v => parseInt(v, 10)),
        row: rowIndex,
        col: colIndex
      }
    })
    grid.push(cells);
  })
  return grid;
}

export const applyGridChanges = (sdk: PlaySudoku, grid: Grid) => {
  grid.forEach(row =>
    row.forEach(cell => {
      const sdkCell = sdk.cells[cellId(cell.col, cell.row)];
      if (isEmptyCell(sdkCell)) sdkCell!.availables = cell.candidates.map(v => `${v}`);
    }));
}
