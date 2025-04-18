import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  GeneratorPageManifest,
  InfosPageManifest,
  ManagementPageManifest,
  PlayerPageManifest,
  PrintPageManifest,
  SUDOKU_PAGE_GENERATOR_LOGIC,
  SUDOKU_PAGE_PLAYER_LOGIC
} from './pages';
import {
  Interaction,
  LogicManager,
  Notifier,
  SUDOKU_API,
  SUDOKU_NOTIFIER,
  SUDOKU_PAGES,
  SUDOKU_PRINT_DOCUMENT,
  SUDOKU_STATE,
  SUDOKU_STORE,
  SudokuState,
  SudokuStore
} from '@olmi/common';
import { printDocumentFactory } from './pages/print/print-document.factory';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    { provide: SUDOKU_API, useFactory: () => new Interaction(environment) },
    { provide: SUDOKU_STORE, useClass: SudokuStore },
    { provide: SUDOKU_NOTIFIER, useClass: Notifier },
    { provide: SUDOKU_PRINT_DOCUMENT, useFactory: printDocumentFactory },
    { provide: SUDOKU_PAGES, useClass: PlayerPageManifest, multi: true },
    { provide: SUDOKU_PAGES, useClass: GeneratorPageManifest, multi: true },
    { provide: SUDOKU_PAGES, useClass: InfosPageManifest, multi: true },
    { provide: SUDOKU_PAGES, useClass: PrintPageManifest, multi: true },
    { provide: SUDOKU_PAGES, useClass: ManagementPageManifest, multi: true },
    { provide: SUDOKU_STATE, useClass: SudokuState },
    { provide: SUDOKU_PAGE_PLAYER_LOGIC, useClass: LogicManager },
    { provide: SUDOKU_PAGE_GENERATOR_LOGIC, useClass: LogicManager }
  ],
};
