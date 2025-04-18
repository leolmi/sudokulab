import { Component, inject, InjectionToken } from '@angular/core';
import { SUDOKU_PRINT_DOCUMENT } from '@olmi/common';
import { map, Observable } from 'rxjs';

export const TEMPLATE_PAGE_ID = new InjectionToken<string>('TEMPLATE_PAGE_ID');

@Component({
  selector: 'template-component',
  template: '',
  standalone: true
})
export class TemplateComponent {
  pageId = inject(TEMPLATE_PAGE_ID);
  printDocument = inject(SUDOKU_PRINT_DOCUMENT);

  constructor() {}

  getSchema$(pos: number): Observable<string> {
    return this.printDocument.pages$.pipe(map(pgs => {
      const page = pgs.find(p => p.id === this.pageId);
      return page?.schemas[`${pos}`]||'';
    }))
  }
}
