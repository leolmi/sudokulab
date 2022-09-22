import {ChangeDetectionStrategy, Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

export interface AskDialogArgs {
  message: string;
  hideOk?: boolean;
  okLabel?: string;
  hideCancel?: boolean;
  cancelLabel?: string;
  rightButtons?: boolean;
  leftText?: boolean;
}

@Component({
  selector: 'sudokulab-ask-dialog',
  template: `
  <div class="ask-dialog-message" [class.center-text]="!data.leftText" mat-dialog-content>
    <span>{{data.message}}</span>
  </div>
  <mat-dialog-actions>
    <div fxFlex></div>
    <button mat-stroked-button *ngIf="!data.hideOk" (click)="apply()">{{data.okLabel||'Yes'}}</button>
    <button mat-button *ngIf="!data.hideCancel" mat-dialog-close>{{data.cancelLabel||'No'}}</button>
    <div *ngIf="!data.rightButtons" fxFlex></div>
  </mat-dialog-actions>`,
  styleUrls: ['./ask-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AskDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AskDialogArgs,
              private _dialog: MatDialogRef<AskDialogComponent>) {
  }

  apply() {
    this._dialog.close(true);
  }
}
