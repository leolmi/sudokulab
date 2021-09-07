import { createFeatureSelector } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';

export const featureName = 'sudoku';

export const selectFeature = createFeatureSelector<SudokuStore>(featureName);
