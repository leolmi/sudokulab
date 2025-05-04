import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { MatIconModule } from '@angular/material/icon';
import { Algorithm, AlgorithmType, SUDOKU_AUTHOR_LINK, SUDOKU_AUTHOR_MAIL } from '@olmi/model';
import { getAlgorithms } from '@olmi/algorithms';

@Component({
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatIconModule
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
}
