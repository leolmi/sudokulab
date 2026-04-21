import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Algorithm, AlgorithmType, SUDOKU_AUTHOR_LINK, SUDOKU_AUTHOR_MAIL } from '@olmi/model';
import { getAlgorithms } from '@olmi/algorithms';
import {
  ALGORITHM_INFO_DIALOG_CONFIG,
  AlgorithmInfoDialogComponent,
  hasAlgorithmInfoPage,
} from '@olmi/algorithm-info';

@Component({
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
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
      [AlgorithmType.solver]: 'risolutivo',
      [AlgorithmType.support]: 'contributivo'
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
