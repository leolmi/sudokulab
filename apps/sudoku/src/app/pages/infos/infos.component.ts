import {
  ChangeDetectionStrategy,
  Component,
  computed,
  TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';

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
} from '@olmi/algorithm-info';
import { I18nMatTooltipDirective } from '@olmi/common';

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
