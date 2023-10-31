import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {BoardComponent} from './components/board/board.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {
  BOARD_DATA,
  BoardData,
  GENERATOR_DATA,
  GeneratorData,
  SchemaNamePipe,
  SudokuLab,
  SudokulabPage,
  SudokulabPageExecutor,
  SudokulabPagesService,
  SudokulabWindowService
} from '@sudokulab/model';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {SchemasComponent} from './components/schemas/schemas.component';
import {InfoComponent} from './components/info/info.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {LabComponent} from './pages/lab/lab.component';
import {OptionsComponent} from './pages/options/options.component';
import {GeneratorComponent} from './pages/generator/generator.component';
import {RouterModule} from '@angular/router';
import {LabManifest} from './pages/lab/lab.manifest';
import {GeneratorManifest} from './pages/generator/generator.manifest';
import {OptionsManifest} from './pages/options/options.manifest';
import {GeneratorBoardComponent} from './components/generator-board/generator-board.component';
import {DestroyComponent} from './components/DestroyComponent';
import {MatDialogModule} from '@angular/material/dialog';
import {UploadDialogComponent} from './components/upload-dialog/upload-dialog.component';
import {GeneratorOptionsComponent} from './components/generator-options/generator-options.component';
import {GeneratorStateComponent} from './components/generator-state/generator-state.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatInputModule} from '@angular/material/input';
import {ThumbnailComponent} from './components/thumbnail/thumbnail.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSliderModule} from '@angular/material/slider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {GeneratorToolbarComponent} from './components/generator-toolbar/generator-toolbar.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatRippleModule} from '@angular/material/core';
import {SchemasItemComponent} from './components/schemas/schemas-item.component';
import {KeyBoardComponent} from './components/key-board/key-board.component';
import {SudokuSchemaComponent} from './components/sudoku-schema/sudoku-schema.component';
import {HelpManifest} from './pages/help/help.manifest';
import {HelpComponent} from './pages/help/help.component';
import {BoardStateComponent} from './components/board-state/board-state.component';
import {ImageHandlerComponent} from './components/image-handler/image-handler.component';
import {CameraDialogComponent} from './components/camera-dialog/camera-dialog.component';
import {CropAreaComponent} from './components/image-handler/crop-area.component';
import {SchemaCheckComponent} from './components/schema-check/schema-check.component';
import {PrintComponent} from './pages/print/print.component';
import {PrintManifest} from './pages/print/print.manifest';
import {AppInterceptor} from './app.interceptor';
import {MatCardModule} from '@angular/material/card';
import {SvgBoardComponent} from './components/svg-board/svg-board.component';
import {PrintPageComponent} from './pages/print/print-page.component';
import {SolverStepDetailsComponent} from "./components/solver-step-details/solver-step-details.component";
import {AskDialogComponent} from "./components/ask-dialog/ask-dialog.component";
import {CellValuesComponent} from "./components/cell-values/cell-values.component";
import {SolverStepDetailsPopupComponent} from "./components/solver-step-details/solver-step-details-popup.component";
import {ManagementKeyDialogComponent} from "./components/management-key-dialog/management-key-dialog.component";
import {OperationsBarComponent} from "./components/operations-bar/operations-bar.component";
import {CropPointComponent} from "./components/image-handler/crop-point.component";
import {BoardWorkerComponent} from "./components/board-worker/board-worker.component";
import {SvgInteractiveBoard} from "./components/svg-interactive-board/svg-interactive-board.component";
import {SudokuLabLogic} from "./app.logic";
import {PrintExecutor} from "./pages/print/print.executor";
import {GeneratorExecutor} from "./pages/generator/generator.executor";
import {LabExecutor} from "./pages/lab/lab.executor";
import {SudokulabExecutorsService} from "./services/sudokulab-executors.service";
import {OptionsExecutor} from "./pages/options/options.executor";

@NgModule({
  declarations: [
    DestroyComponent,
    AppComponent,
    AskDialogComponent,
    BoardComponent,
    SvgInteractiveBoard,
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
    BoardStateComponent,
    BoardWorkerComponent,
    CropAreaComponent,
    ImageHandlerComponent,
    CameraDialogComponent,
    SchemaCheckComponent,
    PrintPageComponent,
    PrintComponent,
    SvgBoardComponent,
    SolverStepDetailsComponent,
    SolverStepDetailsPopupComponent,
    CellValuesComponent,
    ManagementKeyDialogComponent,
    OperationsBarComponent,
    CropPointComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FlexLayoutModule,
    ScrollingModule,
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
    MatCardModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      ...LabManifest.routes(),
      ...GeneratorManifest.routes(),
      ...OptionsManifest.routes(),
      ...HelpManifest.routes(),
      ...PrintManifest.routes()
    ], { useHash: true })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true },
    SudokulabWindowService,
    SudokulabPagesService,
    SudokulabExecutorsService,
    { provide: SudokuLab, useClass: SudokuLabLogic },
    { provide: BOARD_DATA, useClass: BoardData },
    { provide: GENERATOR_DATA, useClass: GeneratorData },
    { provide: SudokulabPage, useClass: LabManifest, multi: true },
    // { provide: SudokulabPage, useClass: GeneratorManifest, multi: true },
    { provide: SudokulabPage, useClass: PrintManifest, multi: true },
    { provide: SudokulabPage, useClass: OptionsManifest, multi: true },
    { provide: SudokulabPage, useClass: HelpManifest, multi: true },
    { provide: SudokulabPageExecutor, useClass: LabExecutor, multi: true },
    { provide: SudokulabPageExecutor, useClass: GeneratorExecutor, multi: true },
    { provide: SudokulabPageExecutor, useClass: PrintExecutor, multi: true },
    { provide: SudokulabPageExecutor, useClass: OptionsExecutor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
