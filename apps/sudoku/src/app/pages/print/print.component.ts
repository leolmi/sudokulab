import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PageBase } from '../../model/page.base';
import { PrintPageComponent } from './print-page.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PRINT_USER_OPTIONS_FEATURE } from './print.model';
import { DEFAULT_PRINT_TEMPLATE, Dictionary, MenuItem, PrintPage, PrintPageEx, Sudoku } from '@olmi/model';
import { keys as _keys, reduce as _reduce } from 'lodash';
import { SchemasBrowserComponent, SchemasToolbarComponent } from '@olmi/schemas-browser';
import { AppUserOptions, PrintDocument, SUDOKU_PRINT_DOCUMENT, SudokuStore } from '@olmi/common';
import { TEMPLATES } from '@olmi/templates';
import { calcStatusForMenu } from './print.menu';


@Component({
  imports: [
    ScrollingModule,
    PrintPageComponent,
    SchemasBrowserComponent,
    SchemasToolbarComponent,
  ],
  selector: 'sudoku-print',
  templateUrl: './print.component.html',
  styleUrl: './print.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintComponent extends PageBase {
  readonly printDocument = inject(SUDOKU_PRINT_DOCUMENT);

  readonly schemas = signal<Sudoku[]>([]);

  // toSignal su template$ e pages$ del PrintDocument (servizio non ancora migrato a signal)
  readonly pages = toSignal(this.printDocument.pages$, { initialValue: [] as PrintPage[] });
  readonly template = toSignal(this.printDocument.template$, { initialValue: '' });
  readonly activePageSchema = toSignal(this.printDocument.activePageSchema$, { initialValue: '' as string });

  readonly pagesCount = computed<number>(() => (this.pages() || []).length);
  readonly schemaCount = computed<number>(() =>
    _reduce(this.pages() || [], (t, p) => t + getSchemaCountForPage(p), 0));

  constructor() {
    super();

    this.printDocument.template$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(template => AppUserOptions.updateFeature(PRINT_USER_OPTIONS_FEATURE, { template }));

    this.state.menuHandler = (item) => this.handleMenuItem(item);

    // aggiorna lo stato del menu al variare di pagine/template
    effect(() => {
      const pages = this.pages();
      const template = this.template();
      this.state.updateStatus(calcStatusForMenu(pages, template || DEFAULT_PRINT_TEMPLATE));
    });
  }

  handleMenuItem(item: MenuItem) {
    switch (item.logic) {
      case 'navigate':
        this.printDocument.template$.next(item.property || '');
        break;
      default:
        switch (item.property) {
          case 'print':
            doPrintDocument(this.printDocument, this.store);
            break;
          case 'clear':
            this.printDocument.pages$.next([]);
            break;
        }
        break;
    }
  }

  setSchemas(sdks?: Sudoku[]) {
    this.schemas.set(sdks || []);
  }
}


const getSchemaCountForPage = (p: PrintPage): number => {
  return _keys(p.schemas).filter(k => !!p.schemas[k]).length;
}

const doPrintDocument = (doc: PrintDocument, store: SudokuStore): void => {
  const template = TEMPLATES.find(t => t.name === doc.template$.value);
  if (template) {
    const pages = doc.pages$.value || [];
    const html = pages
      .map((page, i) => {
        const sudokus: Dictionary<Sudoku> = {};
        _keys(page.schemas).forEach(k => {
          const sdk = store.getSudoku(page.schemas[k]);
          if (sdk) sudokus[k] = sdk;
        });
        const pageEx = new PrintPageEx({ ...page, sudokus });
        return template.compose(pageEx, i >= (pages.length - 1));
      })
      .join('\n');
    const print_page: any = window.open(`../assets/print.html`);
    if (!!print_page) print_page.data = { html };
  }
}
