import { AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SchemasBrowserComponent, SchemasToolbarComponent } from '@olmi/schemas-browser';
import { Algorithm, Sudoku } from '@olmi/model';
import { SUDOKU_STORE } from '@olmi/common';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { getAlgorithms } from '@olmi/algorithms';
import { remove as _remove } from 'lodash';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';

export class SchemasDialogArgs {
  sudoku?: Sudoku;
}

@Component({
  selector: 'schemas-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    SchemasBrowserComponent,
    MatIcon,
    MatBadge,
    SchemasToolbarComponent,
    MatTooltip,
  ],
  template: `
    <!-- HEADER -->
    <div mat-dialog-title>
      <schemas-toolbar
        [onlyPlaying]="playing()"
        [algorithms]="algorithms()"
        persistenceKey="dialog"
        (onFilter)="setSchemaList($event)"
      ></schemas-toolbar>
    </div>

    <!-- BODY -->
    <mat-dialog-content class="schemas-dialog-content">
      <schemas-browser
        [activeSchema]="activeSchema()?.values||''"
        (clickOnSchema)="setSelection($event)"
        [schemas]="schemas()"
      ></schemas-browser>
    </mat-dialog-content>

    <!-- ACTIONS -->
    <mat-dialog-actions>
      @if (store.isDownload()) {
        <button mat-icon-button
                matTooltip="download all catalog"
                (click)="download()">
          <mat-icon>file_download</mat-icon>
        </button>
      }
      <button mat-icon-button
              matTooltip="show only playing games"
              (click)="togglePlaying()">
        <mat-icon>{{ playing()?'edit':'edit_off' }}</mat-icon>
      </button>
      <button mat-icon-button
              matTooltip="Choose used algorithms filter"
              [matBadge]="algCount()+''"
              [matBadgeHidden]="algCount()<1"
              [matMenuTriggerFor]="algmenu">
        <mat-icon>fact_check</mat-icon>
      </button>
      <div class="flex-1"></div>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button
              [disabled]="!activeSchema()"
              (click)="select()"
      >Load</button>
      <!-- MENU POPUP DEGLI ALGORITMI -->
      <mat-menu #algmenu="matMenu">
        @let algs = algorithms();
        @for (alg of availableAlgorithms; track $index) {
          <button mat-menu-item
                  [class.active]="algs.includes(alg.id)"
                  (click)="toggleAlg(alg)">
            <mat-icon>{{alg.icon}}</mat-icon>
            <span>{{alg.name}}</span>
          </button>
        }
      </mat-menu>
    </mat-dialog-actions>
  `,
  styleUrl: './schemas-dialog.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemasDialogComponent implements AfterViewInit {
  private readonly _dialogRef = inject(MatDialogRef<SchemasDialogComponent>);
  private readonly _data = inject<SchemasDialogArgs>(MAT_DIALOG_DATA);
  readonly store = inject(SUDOKU_STORE);

  readonly activeSchema = signal<Sudoku | undefined>(undefined);
  readonly playing = signal<boolean>(false);
  readonly algorithms = signal<string[]>([]);
  readonly schemas = signal<Sudoku[]>([]);

  readonly algCount = computed<number>(() => (this.algorithms() || []).length);
  readonly availableAlgorithms: Algorithm[] = getAlgorithms();

  ngAfterViewInit() {
    setTimeout(() => this.activeSchema.set(this._data.sudoku), 200);
  }

  select() {
    this._dialogRef.close(this.activeSchema());
  }

  setSelection(sdk?: Sudoku) {
    if (!!sdk && this.activeSchema()?.values === sdk?.values) {
      this.select();
    } else {
      this.activeSchema.set(sdk);
    }
  }

  download() {
    this.store.download();
  }

  togglePlaying() {
    this.playing.update(v => !v);
  }

  toggleAlg(alg: Algorithm) {
    this.algorithms.update(prev => {
      const algs = [...prev];
      if (algs.includes(alg.id)) _remove(algs, a => a === alg.id);
      else algs.push(alg.id);
      return algs;
    });
  }

  setSchemaList(sdks?: Sudoku[]) {
    this.schemas.set(sdks || []);
  }
}
