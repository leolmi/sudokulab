import { Document } from 'mongoose';

export interface SudokuDoc extends Document {
  readonly _id: string;
  readonly name: string;
  readonly values: string;
  readonly info: any;
}
