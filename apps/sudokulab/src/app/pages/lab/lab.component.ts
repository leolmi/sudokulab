import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent implements OnDestroy {
  constructor() {
  }
  ngOnDestroy() {
  }
}
