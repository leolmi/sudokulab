import {ChangeDetectionStrategy, Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'sudokulab-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadDialogComponent {
  isNotValid$: BehaviorSubject<boolean>;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
              private _dialogRef: MatDialogRef<UploadDialogComponent>) {
    this.isNotValid$ = new BehaviorSubject<boolean>(true);
  }

  generate() {

  }
}
