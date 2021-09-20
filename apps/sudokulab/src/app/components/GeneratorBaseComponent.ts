import { DestroyComponent } from './DestroyComponent';
import { GeneratorFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export class GeneratorBaseComponent extends DestroyComponent {
  running$: Observable<boolean>;
  constructor(_generator: GeneratorFacade) {
    super();
    this.running$ = _generator.selectGeneratorIsRunning$.pipe(takeUntil(this._destroy$));
  }
}
