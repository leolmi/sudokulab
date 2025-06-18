import { Connection } from 'mongoose';
import { SudokuSchema } from './sudoku.schema';
const SUDOKU_SCHEMA_NAME = 'Sudoku2';

export const sudokuProviders = [
  {
    provide: 'SUDOKU_MODEL',
    useFactory: (connection: Connection) => connection.model(SUDOKU_SCHEMA_NAME, SudokuSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
