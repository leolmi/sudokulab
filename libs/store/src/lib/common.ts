import { createFeatureSelector } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { featureName } from '@sudokulab/model';

export const selectFeature = createFeatureSelector<SudokuStore>(featureName);
