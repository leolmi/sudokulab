import { InjectionToken } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { cloneDeep as _clone, remove as _remove } from 'lodash';
import { decodeActiveArea, DEFAULT_PRINT_TEMPLATE, PrintPage } from '@olmi/model';

export class PrintDocument {
  activeArea$: BehaviorSubject<string>;
  template$: BehaviorSubject<string>;
  pages$: BehaviorSubject<PrintPage[]>;

  isAlone$: Observable<boolean>;
  activePageSchema$: Observable<string>;

  constructor(template?: string) {
    this.template$ = new BehaviorSubject<string>(template || DEFAULT_PRINT_TEMPLATE);
    this.activeArea$ = new BehaviorSubject<string>('');
    this.pages$ = new BehaviorSubject<PrintPage[]>([]);

    this.isAlone$ = this.pages$.pipe(map(pgs => pgs.length === 1));

    this.activePageSchema$ = combineLatest([this.pages$, this.activeArea$])
      .pipe(map(([pages, area]: [PrintPage[], string]) => {
        const a = decodeActiveArea(area);
        const page = pages.find(p => p.id === a.pageId);
        return (page?.schemas||{})[a.position]||'';
      }));
  }

  addPage(): PrintPage {
    const page = new PrintPage();
    const pages = _clone(this.pages$.value);
    this.pages$.next([...pages, page]);
    return page;
  }

  updatePage(pid: string, handler: (page: PrintPage) => void): void {
    const pages = _clone(this.pages$.value);
    const page = pages.find(p => p.id === pid);
    if (page) {
      handler(page);
      this.pages$.next(pages);
    }
  }

  removePage(pid: string) {
    const pages = _clone(this.pages$.value);
    _remove(pages, p => p.id === pid);
    this.pages$.next(pages);
  }

  addSchema(schema: string) {
    const area = decodeActiveArea(this.activeArea$.value);
    if (area.pageId) {
      this.updatePage(area.pageId, (page) => {
        page.schemas[`${area.position}`] = schema;
      });
    }
  }


}

export const SUDOKU_PRINT_DOCUMENT = new InjectionToken<PrintDocument>('SUDOKU_PRINT_DOCUMENT');
