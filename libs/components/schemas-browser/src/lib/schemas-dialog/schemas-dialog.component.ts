import { AfterViewInit, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SchemasBrowserComponent } from '@olmi/schemas-browser';
import { BehaviorSubject } from 'rxjs';
import { Sudoku } from '@olmi/model';
import { SUDOKU_STORE } from '@olmi/common';
import { saveAs } from 'file-saver';

export class SchemasDialogArgs {
  sudoku?: Sudoku
}

@Component({
  selector: 'schemas-dialog',
  imports: [
    CommonModule,
    FlexModule,
    MatDialogModule,
    MatButtonModule,
    SchemasBrowserComponent
  ],
  template: `
    <h2 mat-dialog-title>Open Schema</h2>
    <mat-dialog-content class="schemas-dialog-content">
      <schemas-browser
        persistenceKey="dialog"
        [activeSchema]="(activeSchema$|async)?.values||''"
        (clickOnSchema)="setSelection($event)"
      ></schemas-browser>
    </mat-dialog-content>
    <mat-dialog-actions>
      @if (store.isDownload$|async) {
        <button mat-button (click)="download()">Download</button>
      }
      <div fxFlex></div>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button
              [disabled]="!(activeSchema$|async)"
              (click)="select()"
      >Load</button>
    </mat-dialog-actions>
  `,
  styleUrl: './schemas-dialog.component.scss',
  standalone: true
})
export class SchemasDialogComponent implements AfterViewInit {
  private readonly _dialogRef = inject(MatDialogRef<SchemasDialogComponent>);
  private readonly _data = inject<SchemasDialogArgs>(MAT_DIALOG_DATA);
  store = inject(SUDOKU_STORE);
  activeSchema$: BehaviorSubject<Sudoku|undefined>;

  constructor() {
    this.activeSchema$ = new BehaviorSubject<Sudoku|undefined>(undefined);
  }

  ngAfterViewInit() {
    setTimeout(() => this.activeSchema$.next(this._data.sudoku), 200);
  }

  get activeSudoku() {
    return this.activeSchema$.value;
  }

  select() {
    this._dialogRef.close(this.activeSudoku);
  }

  setSelection(sdk?: Sudoku) {
    if (!!sdk && this.activeSudoku?.values === sdk?.values) {
      this.select();
    } else {
      this.activeSchema$.next(sdk);
    }
  }

  download() {
    this.store.download();
  }
}
