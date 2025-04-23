import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { PrintPageComponent } from './print-page.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PRINT_USER_OPTIONS_FEATURE } from './print.model';
import { DEFAULT_PRINT_TEMPLATE, Dictionary, MenuItem, PrintPage, PrintPageEx, Sudoku } from '@olmi/model';
import { keys as _keys, reduce as _reduce } from 'lodash';
import { SchemasBrowserComponent, SchemasToolbarComponent } from '@olmi/schemas-browser';
import { AppUserOptions, PrintDocument, SUDOKU_PRINT_DOCUMENT, SudokuStore } from '@olmi/common';
import { BehaviorSubject, combineLatest, map, Observable, takeUntil } from 'rxjs';
import { TEMPLATES } from '@olmi/templates';
import { calcStatusForMenu } from './print.menu';


@Component({
  imports: [
    CommonModule,
    ScrollingModule,
    FlexLayoutModule,
    PrintPageComponent,
    SchemasBrowserComponent,
    SchemasToolbarComponent
  ],
  selector: 'sudoku-print',
  templateUrl: './print.component.html',
  styleUrl: './print.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintComponent extends PageBase {
  printDocument = inject(SUDOKU_PRINT_DOCUMENT);

  schemas$: BehaviorSubject<Sudoku[]>;
  pagesCount$: Observable<number>;
  schemaCount$: Observable<number>;

  constructor() {
    super();
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);

    this.printDocument.template$
      .pipe(takeUntil(this._destroy$))
      .subscribe(template => AppUserOptions.updateFeature(PRINT_USER_OPTIONS_FEATURE, { template }));

    this.state.menuHandler = (item) => this.handleMenuItem(item);

    this.pagesCount$ = this.printDocument.pages$.pipe(
      takeUntil(this._destroy$),
      map((pgs: PrintPage[]) => (pgs || []).length));
    this.schemaCount$ = this.printDocument.pages$.pipe(
      takeUntil(this._destroy$),
      map((pgs: PrintPage[]) => _reduce(pgs || [], (t, p) => t + getSchemaCountForPage(p), 0)));

    combineLatest([this.printDocument.pages$, this.printDocument.template$])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([pages, template]) =>
        this.state.updateStatus(calcStatusForMenu(pages, template||DEFAULT_PRINT_TEMPLATE)))
  }

  handleMenuItem(item: MenuItem) {
    switch (item.logic) {
      case 'navigate':
        this.printDocument.template$.next(item.property||'');
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
    this.schemas$.next(sdks||[]);
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
