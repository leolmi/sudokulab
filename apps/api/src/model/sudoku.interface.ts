import { Document } from 'mongoose';

export interface SudokuDoc extends Document {
  readonly _id: number;
  readonly rank: number;
  readonly values: string;
  readonly fixed: string;
  readonly options: any;
  readonly info: any;
}
