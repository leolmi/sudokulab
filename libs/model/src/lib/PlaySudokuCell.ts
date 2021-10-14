import { Cell } from './Cell';

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
  id: string;
  position: number;
  fixed: boolean;
  value: string;
  error: boolean;
  availables: string[];
  pencil: string[];
}
