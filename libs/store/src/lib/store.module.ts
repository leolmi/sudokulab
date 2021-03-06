import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import * as sudoku from './reducers/sudoku.reducers';
import * as lab from './reducers/lab.reducers';
import * as generator from './reducers/generator.reducers';
import * as print from './reducers/print.reducers';
import { EffectsModule } from '@ngrx/effects';
import { SudokuEffects } from './effects/sudoku.effects';
import { LabEffects } from './effects/lab.effects';
import { GeneratorEffects } from './effects/generator.effects';
import { MatDialogModule } from '@angular/material/dialog';
import { featureName } from '@sudokulab/model';
import { PrintEffects } from './effects/print.effects';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    StoreModule.forFeature(featureName, {
      sudoku: sudoku.reducer,
      lab: lab.reducer,
      generator: generator.reducer,
      print: print.reducer
    }),
    EffectsModule.forFeature([
      SudokuEffects,
      LabEffects,
      GeneratorEffects,
      PrintEffects
    ])
  ]
})
export class SudokuStoreModule {}
