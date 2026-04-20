import { Connection } from 'mongoose';
import { SudokuSchema } from './sudoku.schema';
import { CatalogStateSchema } from './catalog-state.schema';
const SUDOKU_SCHEMA_NAME = 'Sudoku2';
const CATALOG_STATE_SCHEMA_NAME = 'CatalogState';

export const sudokuProviders = [
  {
    provide: 'SUDOKU_MODEL',
    useFactory: (connection: Connection) => connection.model(SUDOKU_SCHEMA_NAME, SudokuSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'CATALOG_STATE_MODEL',
    useFactory: (connection: Connection) => connection.model(CATALOG_STATE_SCHEMA_NAME, CatalogStateSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
