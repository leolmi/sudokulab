import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {GENERATOR_DATA, GeneratorAction, GeneratorData, GeneratorMode, getGeneratorStatus} from '@sudokulab/model';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'sudokulab-generator-toolbar',
  templateUrl: './generator-toolbar.component.html',
  styleUrls: ['./generator-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorToolbarComponent {
  description$: Observable<string>;
  constructor(@Inject(GENERATOR_DATA) public generator: GeneratorData) {
    this.description$ = generator.sdk$.pipe(
      map((sdk) => {
        const status = getGeneratorStatus(sdk);
        switch(status.mode) {
          case GeneratorMode.single:
            return `${status.total} fixed cells`;
          case GeneratorMode.fixed:
            return `${status.total} fixed cells  (${status.fixed} fixed values, ${status.dynamics} dynamic values)`;
          case GeneratorMode.multiple:
            return `${status.total} fixed cells  (${status.fixed} fixed values, ${status.dynamics} dynamic values, ${status.generated} generated values)`;
          case GeneratorMode.unknown:
          default:
            return '';
        }
      }));
  }

  run() {
    this.generator.action$.next(GeneratorAction.run);
  }
  stop() {
    this.generator.action$.next(GeneratorAction.stop);
  }
}
