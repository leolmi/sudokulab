import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { PageBase } from '../../model/page.base';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Algorithm, AlgorithmType, Dictionary, SUDOKU_AUTHOR_LINK, SUDOKU_AUTHOR_MAIL } from '@olmi/model';
import { getAlgorithms } from '@olmi/algorithms';
import {
  ALGORITHM_INFO_DIALOG_CONFIG,
  AlgorithmInfoDialogComponent,
  AlgorithmInfoPageComponent,
  hasAlgorithmInfoPage,
  MdHeading,
} from '@olmi/algorithm-info';
import { I18nMatTooltipDirective } from '@olmi/common';

/** Pixel di scroll oltre i quali compare il pulsante "torna su". */
const BACK_TO_TOP_THRESHOLD = 300;

/**
 * Pagina Infos: presentazione dell'applicazione + manuale d'uso.
 *
 * Il contenuto testuale vive nei file `apps/sudoku/public/i18n/pages/Infos.<lang>.md`
 * (vedi `<algorithm-info-page>`). I due frammenti dinamici — la lista degli
 * algoritmi caricati a runtime e il footer "project info" con SVG/link — sono
 * passati come `slots` (`TemplateRef`) e iniettati dal renderer al posto delle
 * shortcode `::slot[algorithms-list]` e `::slot[project-info]` nel markdown.
 *
 * `ViewEncapsulation.None`: gli stili scritti in `.sudokulab-page-help` devono
 * raggiungere anche gli elementi creati dal renderer via `[innerHTML]`, che
 * non ricevono l'attributo di scoping di Angular.
 */
@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    I18nMatTooltipDirective,
    AlgorithmInfoPageComponent,
  ],
  selector: 'sudoku-infos',
  templateUrl: './infos.component.html',
  styleUrl: './infos.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InfosComponent extends PageBase {
  private readonly _route = inject(ActivatedRoute);

  readonly algorithms: Algorithm[] = getAlgorithms();
  readonly TYPEDESC: Dictionary<string> = {
    [AlgorithmType.solver]: 'resolutive',
    [AlgorithmType.support]: 'contributive',
  };
  readonly link = SUDOKU_AUTHOR_LINK;
  readonly mail = `mailto:${SUDOKU_AUTHOR_MAIL}`;

  private readonly _algorithmsListTpl = viewChild<TemplateRef<unknown>>('algorithmsList');
  private readonly _projectInfoTpl = viewChild<TemplateRef<unknown>>('projectInfo');

  protected readonly slots = computed<Dictionary<TemplateRef<unknown>>>(() => {
    const out: Dictionary<TemplateRef<unknown>> = {};
    const a = this._algorithmsListTpl();
    const p = this._projectInfoTpl();
    if (a) out['algorithms-list'] = a;
    if (p) out['project-info'] = p;
    return out;
  });

  protected readonly params = computed(() => ({
    algorithmsCount: this.algorithms.length,
  }));

  // Sommario della pagina: solo i titoli di primo livello (`#` → h2) del
  // markdown, letti dal renderer figlio. Mostrato come riquadro sticky a
  // sinistra sugli schermi larghi e come header in cima su quelli stretti.
  private readonly _page = viewChild(AlgorithmInfoPageComponent);
  protected readonly toc = computed<MdHeading[]>(() =>
    (this._page()?.headings() ?? []).filter(h => h.level === 2));

  // Pulsante "torna su": compare dopo aver scrollato oltre la soglia. È
  // ulteriormente limitato alla sola modalità header (schermi stretti) via CSS,
  // perché sugli schermi larghi il sommario sticky resta sempre visibile.
  private readonly _scrollRoot = viewChild<ElementRef<HTMLElement>>('scrollRoot');
  private readonly _scrolled = signal(false);
  protected readonly showBackToTop = this._scrolled.asReadonly();

  constructor() {
    super();
    // Il markdown della pagina Infos viene caricato in modo asincrono e gli
    // `id` delle sezioni (es. `help-highlights`) compaiono nel DOM solo a
    // rendering avvenuto. Lo scroll al fragment è quindi gestito con un
    // polling: ogni 100ms per ~6s cerca l'elemento target e — appena esiste —
    // scrolla. Polling è più affidabile di `MutationObserver` perché copre
    // anche il caso in cui l'elemento compaia in un boundary di Angular che
    // non viene registrato come childList mutation diretta su body.
    // Lettura iniziale dallo snapshot per coprire l'apertura della pagina da
    // un'altra route con `Router.navigate([...], { fragment })`.
    const initial = this._route.snapshot.fragment;
    if (initial) this._scrollToFragmentWhenReady(initial);
    this._route.fragment
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(fragment => {
        if (fragment && fragment !== initial) this._scrollToFragmentWhenReady(fragment);
      });
  }

  /**
   * Trova l'elemento di una sezione tramite la classe-ancora `md-anchor-<id>`.
   * Non si usa `getElementById` perché il sanitizer Angular rimuove l'attributo
   * `id` dagli elementi creati via `[innerHTML]` (vedi parser markdown).
   */
  private _findAnchor(id: string): Element | null {
    return document.querySelector(`.md-anchor-${CSS.escape(id)}`);
  }

  /** Scroll alla sezione cliccata nel sommario (contenuto già renderizzato). */
  protected scrollToSection(id: string, ev?: Event): void {
    ev?.preventDefault();
    this._findAnchor(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected onScroll(ev: Event): void {
    this._scrolled.set((ev.target as HTMLElement).scrollTop > BACK_TO_TOP_THRESHOLD);
  }

  protected backToTop(): void {
    this._scrollRoot()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private _scrollToFragmentWhenReady(id: string) {
    let attempts = 0;
    const tick = () => {
      const el = this._findAnchor(id);
      if (el) {
        // double-rAF: il layout è completato dopo il prossimo frame, evita
        // scroll prematuri che andrebbero a una posizione poi spostata dal
        // rendering successivo del markdown.
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })));
        return;
      }
      if (++attempts < 60) setTimeout(tick, 100);
    };
    tick();
  }

  hasInfoPage(id: string): boolean {
    return hasAlgorithmInfoPage(id);
  }

  openAlgorithmInfo(id: string): void {
    this._dialog.open(AlgorithmInfoDialogComponent, {
      ...ALGORITHM_INFO_DIALOG_CONFIG,
      data: { algorithmId: id },
    });
  }
}
