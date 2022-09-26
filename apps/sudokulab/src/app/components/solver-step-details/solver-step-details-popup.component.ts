import {ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {AlgorithmResultLine, SolveStepResult} from "@sudokulab/model";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector: 'sudokulab-solver-step-details-popup',
  template: `
    <div mat-dialog-content class="details-container">
      <sudokulab-solver-step-details [steps]="steps"></sudokulab-solver-step-details>
    </div>
    <mat-dialog-actions>
      <div fxFlex></div>
      <button mat-button mat-dialog-close>OK</button>
    </mat-dialog-actions>`,
  styleUrls: ['./solver-step-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolverStepDetailsPopupComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public steps: SolveStepResult[]) {
  }
}
