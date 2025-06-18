import { Connection } from 'mongoose';
import { SudokuOcrMapSchema } from './ocr-map.schema';

const SUDOKU_OCR_SCHEMA_NAME = 'SudokuOcr';

export const ocrProviders = [
  {
    provide: 'SUDOKU_OCR_MODEL',
    useFactory: (connection: Connection) => connection.model(SUDOKU_OCR_SCHEMA_NAME, SudokuOcrMapSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
