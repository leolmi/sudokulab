import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { MatIconModule } from '@angular/material/icon';
import { AlgorithmType, Algorithm } from '@olmi/model';
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

  constructor() {
    super();
    this.TYPEDESC = {
      [AlgorithmType.solver]: 'risulutivo',
      [AlgorithmType.support]: 'contributivo'
    }
    this.algorithms = getAlgorithms();
  }
}
