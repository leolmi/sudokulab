import {EditSudoku} from "../EditSudoku";
import {cellId} from "../../sudoku-helper";
import {EditSudokuCell} from "../EditSudokuCell";
import {EditSudokuEndGenerationMode} from "../enums";
import {Sudoku} from "../Sudoku";

export class Generator {
  generating: number;
  schemas: Sudoku[];
  stopped: boolean;
  constructor(public sdk: EditSudoku) {
    this.generating = 0;
    this.stopped = false;
    this.schemas = [];
  }

  private _end() {
    this.generating = 0;
  }

  private _generate() {
    // 1. valorizzazione dei fixed vuoti
    // 2.  soluzione > se unica salva schema altrimenti skippa



    if (_isOnEnd(this)) return this._end();
    setTimeout(() => this._generate());
  }

  generate() {
    this.generating = performance.now();
    this.stopped = false;
    // 1. aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
    //    - rispetta la simmetria se specificata
    const fixed = _getFixed(this.sdk);
    const diff = this.sdk.options.fixedCount - fixed.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const fxcell = _addFixed(this.sdk);
        if (!!fxcell) fixed.push(fxcell);
      }
    }

    // 3 avvia il ciclo:
    //    - valorizzazione dei fixed vuoti
    //    - soluzione > se unica salva schema altrimenti skippa
    this._generate();
  }
}

const _getFixed = (sdk: EditSudoku): EditSudokuCell[] => {
  const fixed: EditSudokuCell[] = [];
  for(let col = 0; col<sdk.options.rank; col++) {
    for(let row = 0; row<sdk.options.rank; row++) {
      const cell = sdk.cells[cellId(col, row)];
      if (cell?.fixed) fixed.push(cell);
    }
  }
  return fixed;
}

const _addFixed = (sdk: EditSudoku): EditSudokuCell|undefined => {
  const id = '';

  return sdk.cells[id];
}

const _valorize = (sdk: EditSudoku): void => {

}

const _isOnEnd = (G: Generator): boolean => {
  switch (G.sdk.options.generationEndMode) {
    case EditSudokuEndGenerationMode.afterN:
      return G.schemas.length >= (G.sdk.options.generationEndValue || 1);
    case EditSudokuEndGenerationMode.afterTime:
      const elapsed = performance.now() - G.generating;
      return elapsed >= (G.sdk.options.generationEndValue || 60000);
    case EditSudokuEndGenerationMode.manual:
      return G.stopped;
  }

  return false;
}
