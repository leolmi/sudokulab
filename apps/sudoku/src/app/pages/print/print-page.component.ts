import { ChangeDetectionStrategy, Component, computed, inject, Injector, input, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getPageArea } from '@olmi/model';
import { ComponentPortal, PortalModule } from '@angular/cdk/portal';
import { PrintDocument, SUDOKU_PRINT_DOCUMENT } from '@olmi/common';
import { TEMPLATE_PAGE_ID, TemplateComponent, TEMPLATES } from '@olmi/templates';

export type PageMode = 'page' | 'add';

@Component({
  selector: 'print-page',
  templateUrl: './print-page.component.html',
  styleUrls: ['./print-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PortalModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class PrintPageComponent {
  readonly printDocument = inject(SUDOKU_PRINT_DOCUMENT);

  readonly pageId = input<string | null | undefined>('');
  readonly mode = input<PageMode>('page');
  readonly index = input<number>(0);

  readonly isAddMode = computed<boolean>(() => this.mode() === 'add');

  // re-eval del portal quando l'utente cambia template
  readonly portal = computed<ComponentPortal<TemplateComponent> | ''>(() => {
    this.printDocument.template();
    return getPagePortal(this.printDocument, this.pageId() || '');
  });

  setActiveArea(position: number) {
    this.printDocument.setActiveArea(`${this.pageId() || ''}.${position}`);
  }

  add() {
    const page = this.printDocument.addPage();
    this.printDocument.setActiveArea(getPageArea(page.id));
  }

  clear() {
    this.printDocument.updatePage(this.pageId() || '', p => p.schemas = {});
  }

  remove() {
    this.printDocument.removePage(this.pageId() || '');
  }
}

const getPagePortal = (doc: PrintDocument, pid: string): ComponentPortal<TemplateComponent> | '' => {
  const template = TEMPLATES.find(t => t.name === doc.template());
  if (!template) return '';
  const inj = Injector.create({ providers: [{ provide: TEMPLATE_PAGE_ID, useValue: pid }] });
  return new ComponentPortal<TemplateComponent>(template.editor, <ViewContainerRef | null | undefined>null, inj);
}
