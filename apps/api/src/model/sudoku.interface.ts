import { Document } from 'mongoose';

export interface Sudoku extends Document {
  readonly id: string;
  readonly rank: number;
  readonly values: string;
  readonly fixed: string;
  readonly options: any;
  readonly info: any;
}
