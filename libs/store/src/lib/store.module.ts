import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import * as sudoku from './reducers/sudoku.reducers';
import { EffectsModule } from '@ngrx/effects';
import { SudokuEffects } from './effects/sudoku.effects';
import { featureName } from './common';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(featureName, {
      sudoku: sudoku.reducer
    }),
    EffectsModule.forFeature([
      SudokuEffects
    ])
  ]
})
export class SudokuStoreModule {}
