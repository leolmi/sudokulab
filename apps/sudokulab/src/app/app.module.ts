import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BoardComponent } from './components/board/board.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SudokuFacade } from '@sudokulab/model';
import { SudokuContext, SudokuStoreModule } from '@sudokulab/store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { SchemasComponent } from './components/schemas/schemas.component';
import { InfoComponent } from './components/info/info.component';


@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    SchemasComponent,
    InfoComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    SudokuStoreModule,
    MatSnackBarModule,
    MatButtonModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    BrowserAnimationsModule
  ],
  providers: [
    { provide: SudokuFacade, useClass: SudokuContext }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
