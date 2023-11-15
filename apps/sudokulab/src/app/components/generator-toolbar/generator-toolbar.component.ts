import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {GENERATOR_DATA, GeneratorAction, GeneratorData} from '@sudokulab/model';
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
      // TODO: informazioni di stato sulla generazione
      map((sdk) => ''));
  }
  run = () => this.generator.action$.next(GeneratorAction.run);
  stop = () => this.generator.action$.next(GeneratorAction.stop);
}
