import { ChangeDetectionStrategy, Component } from '@angular/core';
import {Algorithm, AlgorithmType, getAlgorithms} from "@sudokulab/model";

@Component({
  selector: 'sudokulab-help-page',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent {
  algorithms: Algorithm[];
  TYPEDESC: any;
  constructor() {
    this.TYPEDESC = {
      [AlgorithmType.solver]: 'risulutivo',
      [AlgorithmType.support]: 'contributivo'
    }
    this.algorithms = getAlgorithms();
  }
}
