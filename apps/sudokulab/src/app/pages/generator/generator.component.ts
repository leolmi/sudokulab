import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../../components/GeneratorBaseComponent';
import { GeneratorFacade } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends GeneratorBaseComponent implements OnDestroy {
  constructor(private _generator: GeneratorFacade) {
    super(_generator);
  }
  ngOnDestroy() {
  }
}
