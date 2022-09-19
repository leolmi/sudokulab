import {ChangeDetectionStrategy, Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {BehaviorSubject} from "rxjs";
import {SolveStepResult} from "@sudokulab/model";

@Component({
  selector: 'sudokulab-solver-step-details',
  template: `<div mat-dialog-content class="details-container">
    <div class="lines-header">
      <img src="assets/images/board_num.png">
    </div>
    <div class="lines-container">
      <div *ngFor="let line of lines$|async; let index = index"
           class="detail-line"
           fxLayout="row" fxLayoutAlign="start center">
        <div class="line-number">{{(index+1)}}</div>
        <div class="line-text" fxFlex>{{line}}</div>
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
  lines$: BehaviorSubject<string[]>;

  constructor(@Inject(MAT_DIALOG_DATA) private _steps: SolveStepResult[]) {
    this.lines$ = new BehaviorSubject<string[]>((this._steps||[])
      .map(s => s.result?.description)
      .join('\n')
      .split('\n'));
  }

}
