import { ChangeDetectionStrategy, Component, inject, InjectionToken, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SUDOKU_PRINT_DOCUMENT } from '@olmi/common';
import { map } from 'rxjs';

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

  protected readonly activeArea = toSignal(this.printDocument.activeArea$, { initialValue: '' });

  protected getSchema(pos: number): Signal<string> {
    return toSignal(
      this.printDocument.pages$.pipe(map(pgs => {
        const page = pgs.find(p => p.id === this.pageId);
        return page?.schemas[`${pos}`] || '';
      })),
      { initialValue: '' },
    );
  }
}
