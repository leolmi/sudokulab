import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, Signal } from '@angular/core';
import { SUDOKU_PRINT_DOCUMENT } from '@olmi/common';

export const TEMPLATE_PAGE_ID = new InjectionToken<string>('TEMPLATE_PAGE_ID');

@Component({
  selector: 'template-component',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateComponent {
  protected readonly pageId = inject(TEMPLATE_PAGE_ID);
  protected readonly printDocument = inject(SUDOKU_PRINT_DOCUMENT);

  protected readonly activeArea = this.printDocument.activeArea;

  protected getSchema(pos: number): Signal<string> {
    return computed(() => {
      const page = this.printDocument.pages().find(p => p.id === this.pageId);
      return page?.schemas[`${pos}`] || '';
    });
  }
}
