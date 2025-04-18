import { ChangeDetectionStrategy, Component, inject, Injector, Input, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getPageArea } from '@olmi/model';
import { ComponentPortal, PortalModule } from '@angular/cdk/portal';
import { PrintDocument, SUDOKU_PRINT_DOCUMENT } from '@olmi/common';
import { TEMPLATE_PAGE_ID, TemplateComponent, TEMPLATES } from '@olmi/templates';

export type PageMode = 'page'|'add';

@Component({
  selector: 'print-page',
  templateUrl: './print-page.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PortalModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class PrintPageComponent {
  private _mode$: BehaviorSubject<PageMode>;

  printDocument = inject(SUDOKU_PRINT_DOCUMENT);
  pageId$: BehaviorSubject<string>;
  portal$: Observable<ComponentPortal<TemplateComponent>|''>;

  isAddMode$: Observable<boolean>;

  @Input() set pageId(pid: string|null|undefined) {
    this.pageId$.next(pid||'');
  }
  @Input() set mode(m: PageMode) {
    this._mode$.next(m||'page');
  };
  @Input() index: number = 0;

  constructor() {
    this._mode$ = new BehaviorSubject<PageMode>('page');
    this.pageId$ = new BehaviorSubject<string>('');

    this.isAddMode$ = this._mode$.pipe(map(m => m === 'add'));
    this.portal$ = combineLatest([this.pageId$, this.printDocument.template$]).pipe(
      map(([pid, tmp]: [string, string]) => getPagePortal(this.printDocument, pid)));
  }

  setActiveArea(position: number) {
    this.printDocument.activeArea$.next(`${this.pageId$.value}.${position}`);
  }
  add() {
    const page = this.printDocument.addPage();
    this.printDocument.activeArea$.next(getPageArea(page.id));
  }
  clear() {
    this.printDocument.updatePage(this.pageId$.value, p => p.schemas = {});
  }
  remove() {
    this.printDocument.removePage(this.pageId$.value);
  }
}

const getPagePortal = (doc: PrintDocument, pid: string): ComponentPortal<TemplateComponent>|'' => {
  const template = TEMPLATES.find(t => t.name === doc.template$.value);
  if (!template) return '';
  const inj = Injector.create({ providers: [{ provide: TEMPLATE_PAGE_ID, useValue: pid }]});
  return new ComponentPortal<TemplateComponent>(template.editor, <ViewContainerRef|null|undefined>null, inj);
}
