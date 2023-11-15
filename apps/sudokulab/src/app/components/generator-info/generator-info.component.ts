import {ChangeDetectionStrategy, Component, Inject} from "@angular/core";
import {GENERATOR_DATA, GeneratorData, GeneratorStatus, getGeneratorStatus} from "@sudokulab/model";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

@Component({
  selector: 'sudokulab-generator-info',
  templateUrl: './generator-info.component.html',
  styleUrls: ['./generator-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorInfoComponent  {
  status$: Observable<GeneratorStatus>;

  constructor(@Inject(GENERATOR_DATA) public generator: GeneratorData) {
    this.status$ = generator.sdk$.pipe(map(sdk => getGeneratorStatus(sdk)));
  }
}
