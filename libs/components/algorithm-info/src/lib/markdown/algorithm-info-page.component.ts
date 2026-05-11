import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Dictionary } from '@olmi/model';
import { TranslateService } from '@olmi/common';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../sudoku-board-preview/sudoku-board-preview.component';
import { MdBlock, MdParams, parseMarkdown } from './markdown.parser';
import { AlgorithmMarkdownLoader } from './algorithm-markdown.loader';

/**
 * Shell di rendering per le pagine di descrizione scritte in markdown
 * (algoritmi catalogati e altre pagine applicative come `Infos`).
 *
 * Input:
 *  - `key`       — identificatore della pagina (es. `'Bug'`, `'Infos'`).
 *  - `basePath`  — cartella sotto `assets/i18n/` da cui caricare i markdown
 *                  (default `'algorithms'`). Vedi `AlgorithmMarkdownLoader`.
 *  - `samples`   — dizionario `name → SudokuBoardPreviewSample` referenziato
 *                  nel markdown via `::board[name]`.
 *  - `slots`     — dizionario `name → TemplateRef` referenziato nel markdown
 *                  via `::slot[name]`. Permette di iniettare blocchi Angular
 *                  dinamici (componenti, *@for*, click handler) al punto
 *                  giusto del flusso testuale.
 *  - `params`    — dizionario `name → string|number` per la sostituzione di
 *                  placeholder inline `{name}` (es. `{count}`).
 *
 * Il markdown viene caricato (con cache) tramite `AlgorithmMarkdownLoader`,
 * parserizzato in blocchi alternati (testo / board / slot) e renderizzato:
 * i blocchi testuali finiscono in `[innerHTML]` (i tag generati passano il
 * sanitizer Angular), board e slot sono nodi Angular veri e propri.
 *
 * Comportamento al cambio lingua: l'effect rilegge il markdown dalla cache
 * (sincrono dopo il primo fetch) e aggiorna la signal `md` solo a fetch
 * concluso, per evitare flash di contenuto vuoto. Se la traduzione manca
 * (404) si ripiega su `en`.
 *
 * `ViewEncapsulation.None` perché gli stili devono attaccarsi anche agli
 * elementi creati via `[innerHTML]` (che il sanitizer NON marca con
 * l'attributo di scoping di Angular). I selettori sono tutti annidati
 * sotto `.markdown-page` per evitare leak globali.
 */
@Component({
  selector: 'algorithm-info-page',
  standalone: true,
  imports: [SudokuBoardPreviewComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="markdown-page flex-col flex-gap-24">
      @for (block of blocks(); track $index) {
        @switch (block.kind) {
          @case ('html') {
            <div class="md-text" [innerHTML]="block.html"></div>
          }
          @case ('board') {
            <div class="md-board flex-row flex-align-center-center">
              <sudoku-board-preview [sample]="samples()[block.name]" [size]="420">
              </sudoku-board-preview>
            </div>
          }
          @case ('slot') {
            @let tpl = slots()[block.name];
            @if (tpl) {
              <div class="md-slot">
                <ng-container *ngTemplateOutlet="tpl"></ng-container>
              </div>
            }
          }
        }
      }
    </section>
  `,
  styles: [
    `
      .markdown-page {
        max-width: 820px;
        margin: 0 auto;
      }
      .markdown-page h2 {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 600;
        opacity: 0.95;
      }
      .markdown-page h3 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 600;
        opacity: 0.95;
      }
      .markdown-page h4 {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        opacity: 0.9;
      }
      .markdown-page p {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.55;
      }
      .markdown-page ul {
        margin: 0 0 8px 20px;
        padding: 0;
      }
      .markdown-page li {
        font-size: 14px;
        line-height: 1.55;
        margin-bottom: 4px;
      }
      .markdown-page .caption {
        font-size: 13px;
        opacity: 0.75;
        font-style: italic;
        text-align: center;
        max-width: 640px;
        margin-left: auto;
        margin-right: auto;
      }
      .markdown-page code {
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 6px;
        border-radius: 3px;
      }
      .markdown-page .md-board sudoku-board-preview {
        display: inline-block;
        max-width: min(420px, 92vw);
        width: 100%;
      }
      .markdown-page .md-img {
        display: block;
        max-width: 100%;
        margin: 0 auto;
      }
      .markdown-page .material-icons {
        font-size: inherit;
        vertical-align: middle;
        line-height: 1;
      }
    `,
  ],
})
export class AlgorithmInfoPageComponent {
  private readonly _loader = inject(AlgorithmMarkdownLoader);
  protected readonly tr = inject(TranslateService);

  readonly key = input.required<string>();
  readonly basePath = input<string>('algorithms');
  readonly samples = input<Dictionary<SudokuBoardPreviewSample>>({});
  readonly slots = input<Dictionary<TemplateRef<unknown>>>({});
  readonly params = input<MdParams>({});

  private readonly _md = signal<string>('');
  protected readonly blocks = computed<MdBlock[]>(() => parseMarkdown(this._md(), this.params()));

  constructor() {
    effect(async () => {
      const lang = this.tr.lang();
      const key = this.key();
      const basePath = this.basePath();
      let text = await this._loader.load(basePath, key, lang);
      if (!text && lang !== 'en') {
        text = await this._loader.load(basePath, key, 'en');
      }
      this._md.set(text);
    });
  }
}
