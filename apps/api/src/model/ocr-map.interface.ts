import { Document } from 'mongoose';

export interface SudokuOcrMapDoc extends Document {
  readonly size: number;
  readonly text: string;
  readonly map: string;
}
