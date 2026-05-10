import { computed, InjectionToken, signal, Signal, WritableSignal } from '@angular/core';
import { cloneDeep as _clone, remove as _remove } from 'lodash';
import { decodeActiveArea, DEFAULT_PRINT_TEMPLATE, PrintPage } from '@olmi/model';

/**
 * Stato del documento di stampa: template scelto, pagine generate, area
 * (pagina + posizione) attiva. Lo stato è esposto come `Signal<T>` readonly;
 * le mutazioni passano per metodi imperativi espliciti.
 */
export class PrintDocument {
  private readonly _template: WritableSignal<string>;
  private readonly _activeArea = signal<string>('');
  private readonly _pages = signal<PrintPage[]>([]);

  readonly template: Signal<string>;
  readonly activeArea = this._activeArea.asReadonly();
  readonly pages = this._pages.asReadonly();

  /** True se il documento contiene una sola pagina. */
  readonly isAlone: Signal<boolean> = computed(() => this._pages().length === 1);

  /** Schema (string 81 char) dell'area attiva, o stringa vuota se nessuna area. */
  readonly activePageSchema: Signal<string> = computed(() => {
    const a = decodeActiveArea(this._activeArea());
    const page = this._pages().find(p => p.id === a.pageId);
    return (page?.schemas || {})[a.position] || '';
  });

  constructor(template?: string) {
    this._template = signal<string>(template || DEFAULT_PRINT_TEMPLATE);
    this.template = this._template.asReadonly();
  }

  setTemplate(template: string): void {
    this._template.set(template);
  }

  setActiveArea(area: string): void {
    this._activeArea.set(area);
  }

  addPage(): PrintPage {
    const page = new PrintPage();
    this._pages.update(prev => [...prev, page]);
    return page;
  }

  updatePage(pid: string, handler: (page: PrintPage) => void): void {
    this._pages.update(prev => {
      const pages = _clone(prev);
      const page = pages.find(p => p.id === pid);
      if (page) handler(page);
      return pages;
    });
  }

  removePage(pid: string): void {
    this._pages.update(prev => {
      const pages = _clone(prev);
      _remove(pages, p => p.id === pid);
      return pages;
    });
  }

  clearPages(): void {
    this._pages.set([]);
  }

  addSchema(schema: string): void {
    const area = decodeActiveArea(this._activeArea());
    if (!area.pageId) return;
    this.updatePage(area.pageId, page => {
      page.schemas[`${area.position}`] = schema;
    });
  }
}

export const SUDOKU_PRINT_DOCUMENT = new InjectionToken<PrintDocument>('SUDOKU_PRINT_DOCUMENT');
