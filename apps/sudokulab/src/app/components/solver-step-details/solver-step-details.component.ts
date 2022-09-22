import {ChangeDetectionStrategy, Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {BehaviorSubject} from "rxjs";
import {SolveStepResult} from "@sudokulab/model";
import {reduce as _reduce, startsWith as _startsWith} from 'lodash';

interface Line {
  num: number;
  text: string;
  title: boolean;
}

@Component({
  selector: 'sudokulab-solver-step-details',
  template: `<div mat-dialog-content class="details-container">
    <div class="lines-header">
      <img src="assets/images/board_num.png">
    </div>
    <div class="lines-container">
      <div *ngFor="let line of lines$|async"
           class="detail-line"
           fxLayout="row" fxLayoutAlign="start center">
        <div class="line-number" *ngIf="!line.title">{{line.num}}</div>
        <div class="line-text" [class.title]="line.title" fxFlex>{{line.text}}</div>
      </div>
    </div>
  </div>
  <mat-dialog-actions>
    <div fxFlex></div>
    <button mat-button mat-dialog-close>OK</button>
  </mat-dialog-actions>`,
  styleUrls: ['./solver-step-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolverStepDetailsComponent {
  lines$: BehaviorSubject<Line[]>;

  constructor(@Inject(MAT_DIALOG_DATA) private _steps: SolveStepResult[]) {
    this.lines$ = new BehaviorSubject<Line[]>(getLines((this._steps||[])
      .map(s => `>${s.result?.algorithm}\n${s.result?.description}`)
      .join('\n')));
  }

}

const getLines = (txt: string): Line[] => {
  const lines = txt.split('\n');
  let counter = 0;
  return _reduce(lines, (cll, l) => {
    const isTitle = _startsWith(l, '>');
    counter = counter + (isTitle ? 0 : 1);
    return cll.concat({
      num: counter,
      text: isTitle ? l.substr(1) : l,
      title: isTitle
    });
  }, <Line[]>[]);
}
