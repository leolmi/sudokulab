import { Cell } from './Cell';

/**
 * CELLA DELLO SCHEMA SUDOKU
 */
export class PlaySudokuCell implements Cell {
  constructor(c?: Partial<PlaySudokuCell>) {
    this.id = '';
    this.position = 0;
    this.value = '';
    this.availables = [];
    this.pencil = [];
    this.fixed = false;
    this.error = false;
    Object.assign(this, c || {});
  }
  // identificativo della cella
  id: string;
  // posizione (sequenziale) nello schema (0-80 per sudoku 9x9)
  position: number;
  // se vero contine un valore fisso
  fixed: boolean;
  // valore
  value: string;
  // errore all'interno dello schema
  error: boolean;
  // valori possibili per la cella
  availables: string[];
  // valori stimati dall'utente
  pencil: string[];
}
