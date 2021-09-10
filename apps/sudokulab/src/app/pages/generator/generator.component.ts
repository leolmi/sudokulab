import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent implements OnDestroy {
  constructor() {
  }
  ngOnDestroy() {
  }
}
