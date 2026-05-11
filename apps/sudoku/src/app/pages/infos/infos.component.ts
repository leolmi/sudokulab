import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageBase } from '../../model/page.base';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Algorithm, AlgorithmType, SUDOKU_AUTHOR_LINK, SUDOKU_AUTHOR_MAIL } from '@olmi/model';
import { getAlgorithms } from '@olmi/algorithms';
import {
  ALGORITHM_INFO_DIALOG_CONFIG,
  AlgorithmInfoDialogComponent,
  hasAlgorithmInfoPage,
} from '@olmi/algorithm-info';
import { I18nMatTooltipDirective } from '@olmi/common';

@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    I18nMatTooltipDirective,
],
  selector: 'sudoku-infos',
  templateUrl: './infos.component.html',
  styleUrl: './infos.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfosComponent extends PageBase {
  algorithms: Algorithm[] = [];
  TYPEDESC: any;
  link = SUDOKU_AUTHOR_LINK;
  mail = `mailto:${SUDOKU_AUTHOR_MAIL}`;

  constructor() {
    super();
    this.TYPEDESC = {
      [AlgorithmType.solver]: 'resolutive',
      [AlgorithmType.support]: 'contributive'
    }
    this.algorithms = getAlgorithms();
  }

  hasInfoPage(id: string): boolean {
    return hasAlgorithmInfoPage(id);
  }

  openAlgorithmInfo(id: string) {
    this._dialog.open(AlgorithmInfoDialogComponent, {
      ...ALGORITHM_INFO_DIALOG_CONFIG,
      data: { algorithmId: id },
    });
  }
}
