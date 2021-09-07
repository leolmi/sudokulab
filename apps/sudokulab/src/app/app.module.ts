import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BoardComponent } from './components/board.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SudokuFacade } from '@sudokulab/model';
import { SudokuContext, SudokuStoreModule } from '@sudokulab/store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';


@NgModule({
  declarations: [
    AppComponent,
    BoardComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    SudokuStoreModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([])
  ],
  providers: [
    { provide: SudokuFacade, useClass: SudokuContext }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
