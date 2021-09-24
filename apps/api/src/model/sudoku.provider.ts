import { Connection } from 'mongoose';
import { SudokuSchema } from './sudoku.schema';

export const sudokuProviders = [
  {
    provide: 'SUDOKU_MODEL',
    useFactory: (connection: Connection) => connection.model('Sudoku', SudokuSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
