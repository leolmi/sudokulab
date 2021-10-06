import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";
import { BehaviorSubject } from 'rxjs';
import { isDebugMode, setDebugMode } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-options-page',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent  {
  isDebugMode$: BehaviorSubject<boolean>;
  showAvailable$: BehaviorSubject<boolean>;

  constructor() {
    this.isDebugMode$ = new BehaviorSubject<boolean>(isDebugMode());
    this.showAvailable$ = new BehaviorSubject<boolean>(false);
  }

  setDebugMode(e: any) {
    setDebugMode(e.checked);
  }

  apply(e: any, target: string) {

  }
}
