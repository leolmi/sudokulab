import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BoardComponent } from './components/board/board.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  GeneratorFacade,
  LabFacade, OptionsFacade,
  SchemaNamePipe,
  SudokuFacade,
  SudokulabPage,
  SudokulabPagesService,
  SudokulabWindowService
} from '@sudokulab/model';
import { OptionsContext, GeneratorContext, LabContext, SudokuContext, SudokuStoreModule } from '@sudokulab/store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { SchemasComponent } from './components/schemas/schemas.component';
import { InfoComponent } from './components/info/info.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LabComponent } from './pages/lab/lab.component';
import { OptionsComponent } from './pages/options/options.component';
import { GeneratorComponent } from './pages/generator/generator.component';
import { RouterModule } from '@angular/router';
import { AvailablePages } from './model';
import { LabManifest } from './pages/lab/lab.manifest';
import { GeneratorManifest } from './pages/generator/generator.manifest';
import { OptionsManifest } from './pages/options/options.manifest';
import { GeneratorBoardComponent } from './components/generator-board/generator-board.component';
import { DestroyComponent } from './components/DestroyComponent';
import { MatDialogModule } from '@angular/material/dialog';
import { UploadDialogComponent } from './components/upload-dialog/upload-dialog.component';
import { GeneratorOptionsComponent } from './components/generator-options/generator-options.component';
import { GeneratorStateComponent } from './components/generator-state/generator-state.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { ThumbnailComponent } from './components/thumbnail/thumbnail.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneratorToolbarComponent } from './components/generator-toolbar/generator-toolbar.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatRippleModule } from '@angular/material/core';
import { SchemasItemComponent } from './components/schemas/schemas-item.component';
import { KeyBoardComponent } from './components/key-board/key-board.component';
import { SudokuSchemaComponent } from './components/sudoku-schema/sudoku-schema.component';
import { HelpManifest } from './pages/help/help.manifest';
import { HelpComponent } from './pages/help/help.component';
import { BoardStateComponent } from './components/board-state/board-state.component';

@NgModule({
  declarations: [
    DestroyComponent,
    AppComponent,
    BoardComponent,
    GeneratorBoardComponent,
    SchemasItemComponent,
    SchemasComponent,
    InfoComponent,
    LabComponent,
    OptionsComponent,
    GeneratorComponent,
    UploadDialogComponent,
    GeneratorOptionsComponent,
    GeneratorStateComponent,
    ThumbnailComponent,
    GeneratorToolbarComponent,
    KeyBoardComponent,
    SchemaNamePipe,
    SudokuSchemaComponent,
    HelpComponent,
    BoardStateComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    ScrollingModule,
    SudokuStoreModule,
    MatSnackBarModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatRippleModule,
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
        path: `${AvailablePages.lab}/:id`,
        component: LabComponent
      }, {
        path: `${AvailablePages.generator}`,
        component: GeneratorComponent
      }, {
        path: `${AvailablePages.options}`,
        component: OptionsComponent
      }, {
        path: `${AvailablePages.help}`,
        component: HelpComponent
      }],
      { useHash: true }
    )
  ],
  providers: [
    SudokulabWindowService,
    SudokulabPagesService,
    { provide: SudokuFacade, useClass: SudokuContext },
    { provide: LabFacade, useClass: LabContext },
    { provide: GeneratorFacade, useClass: GeneratorContext },
    { provide: OptionsFacade, useClass: OptionsContext },
    { provide: SudokulabPage, useClass: LabManifest, multi: true },
    { provide: SudokulabPage, useClass: GeneratorManifest, multi: true },
    { provide: SudokulabPage, useClass: HelpManifest, multi: true },
    { provide: SudokulabPage, useClass: OptionsManifest, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
