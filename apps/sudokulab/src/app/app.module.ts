import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {BoardComponent} from './components/board/board.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {GeneratorFacade, LabFacade, SudokuFacade, SudokulabPage} from '@sudokulab/model';
import {GeneratorContext, LabContext, SudokuContext, SudokuStoreModule} from '@sudokulab/store';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {SchemasComponent} from './components/schemas/schemas.component';
import {InfoComponent} from './components/info/info.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {LabComponent} from "./pages/lab/lab.component";
import {OptionsComponent} from "./pages/options/options.component";
import {GeneratorComponent} from "./pages/generator/generator.component";
import {RouterModule} from "@angular/router";
import {AvailablePages} from "./model";
import {LabManifest} from "./pages/lab/lab.manifest";
import {GeneratorManifest} from "./pages/generator/generator.manifest";
import {OptionsManifest} from "./pages/options/options.manifest";
import {SudokulabPagesService} from "./services/sudokulab-pages.service";
import {GeneratorBoardComponent} from "./components/generator-board/generator-board.component";


@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    GeneratorBoardComponent,
    SchemasComponent,
    InfoComponent,
    LabComponent,
    OptionsComponent,
    GeneratorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    SudokuStoreModule,
    MatSnackBarModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    BrowserAnimationsModule,
    RouterModule.forRoot([{
        path: '',
        component: LabComponent
      }, {
        path: `${AvailablePages.lab}`,
        component: LabComponent
      }, {
        path: `${AvailablePages.generator}`,
        component: GeneratorComponent
      }, {
        path: `${AvailablePages.options}`,
        component: OptionsComponent
      }],
      { useHash: true }
    )
  ],
  providers: [
    SudokulabPagesService,
    { provide: SudokuFacade, useClass: SudokuContext },
    { provide: LabFacade, useClass: LabContext },
    { provide: GeneratorFacade, useClass: GeneratorContext },
    { provide: SudokulabPage, useClass: LabManifest, multi: true },
    { provide: SudokulabPage, useClass: GeneratorManifest, multi: true },
    { provide: SudokulabPage, useClass: OptionsManifest, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
