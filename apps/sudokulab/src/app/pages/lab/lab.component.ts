import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";
import {LabFacade} from "@sudokulab/model";
import {filter, takeUntil} from "rxjs/operators";
import {DestroyComponent} from "../../components/DestroyComponent";
import {MatDialog} from "@angular/material/dialog";
import {UploadDialogComponent} from "../../components/upload-dialog/upload-dialog.component";

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnDestroy {
  constructor(private _lab: LabFacade,
              private _dialog: MatDialog) {
    super();
    _lab.onUpload$
      .pipe(takeUntil(this._destroy$), filter(a => !!a))
      .subscribe(() => this._dialog.open(UploadDialogComponent, { width: '500px' }));
  }
}
