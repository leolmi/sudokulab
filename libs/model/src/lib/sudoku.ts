import { SudokuCell } from './sudoku-cell';
import { SudokuInfo, SudokuInfoEx } from './sudoku-info';
import { buildSudokuCells, getBaseValues, getCellsSchema } from '../model.helper';

/**
 * Informazioni di base dello schema
 */
export class Sudoku {
  constructor(s?: Partial<Sudoku>) {
    Object.assign(<any>this, s || {});

    this.name = s?.name||'';
    this.values = s?.values||getBaseValues();
    this.info = new SudokuInfo(s?.info);
    this._id = this.values;
  }

  _id: string;
  name: string;
  values: string;
  info: SudokuInfo;
}

/**
 * estensione della classe Sudoku
 */
export class SudokuEx extends Sudoku {
  constructor(s?: Partial<SudokuEx>) {
    super(s);

    this.cells = [];
    checkCells(this, s?.cells);
    this.info = new SudokuInfoEx(s?.info);
  }

  cells: SudokuCell[];
  override info: SudokuInfoEx;
}

/**
 * verifica la consistenza dei dati fondamentali: `cells`, `values`
 * @param sdk
 * @param cells
 */
const checkCells = (sdk: SudokuEx, cells?: SudokuCell[]): void => {
  if ((cells || []).length > 0) {
    sdk.cells = (cells || []).map(c => new SudokuCell(c));
  } else if (sdk.values) {
    sdk.cells = buildSudokuCells(sdk.values);
  }
  const bvalues = getBaseValues();
  if (sdk.values||bvalues === bvalues) {
    sdk.values = getCellsSchema(sdk.cells);
    sdk._id = sdk.values;
  }
}
