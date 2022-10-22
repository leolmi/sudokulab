import {ChangeDetectionStrategy, Component} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'sudokulab-management-key-dialog',
  template: `
    <h2 class="management-title" mat-dialog-title>Enter management key</h2>
    <div>
      <p>This operation is under secret key.<br>After 5 unsuccessful attempts, access will be blocked for the rest of the day</p>
      <input matInput
             class="input-management-key"
             autocomplete="off"
             [value]="(key$|async)"
             placeholder="enter key..."
             (input)="applyKey($event)">
    </div>
    <mat-dialog-actions>
      <div fxFlex></div>
      <button mat-stroked-button [disabled]="!(key$|async)" (click)="apply()">OK</button>
      <button mat-button mat-dialog-close>Cancel</button>
      <div fxFlex></div>
    </mat-dialog-actions>`,
  styleUrls: ['./management-key-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagementKeyDialogComponent {
  key$: BehaviorSubject<string>;

  constructor(private _dialogRef: MatDialogRef<ManagementKeyDialogComponent>) {
    this.key$ = new BehaviorSubject<string>('');
  }

  applyKey(e: any) {
    if (!e?.target) return;
    this.key$.next((<HTMLInputElement>e?.target).value);
  }

  apply() {
    this._dialogRef.close(this.key$.value);
  }
}
