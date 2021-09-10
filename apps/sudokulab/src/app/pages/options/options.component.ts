import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";

@Component({
  selector: 'sudokulab-options-page',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent implements OnDestroy {
  constructor() {
  }
  ngOnDestroy() {
  }
}
