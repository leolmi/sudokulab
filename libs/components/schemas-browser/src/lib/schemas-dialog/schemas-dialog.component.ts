import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SchemasBrowserComponent, SchemasToolbarComponent } from '@olmi/schemas-browser';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Algorithm, Sudoku } from '@olmi/model';
import { SUDOKU_STORE } from '@olmi/common';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { getAlgorithms } from '@olmi/algorithms';
import { remove as _remove } from 'lodash';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';

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
    MatMenuModule,
    SchemasBrowserComponent,
    MatIcon,
    MatBadge,
    SchemasToolbarComponent,
    MatTooltip
  ],
  template: `
    <!-- HEADER -->
    <div mat-dialog-title>
      <schemas-toolbar
        [onlyPlaying]="playing$|async"
        [algorithms]="algorithms$|async"
        persistenceKey="dialog"
        (onFilter)="setSchemaList($event)"
      ></schemas-toolbar>
    </div>

    <!-- BODY -->
    <mat-dialog-content class="schemas-dialog-content">
      <schemas-browser
        [activeSchema]="(activeSchema$|async)?.values||''"
        (clickOnSchema)="setSelection($event)"
        [schemas]="schemas$|async"
      ></schemas-browser>
    </mat-dialog-content>

    <!-- ACTIONS -->
    <mat-dialog-actions>
      @if (store.isDownload$|async) {
        <button mat-icon-button
                matTooltip="download all catalog"
                (click)="download()">
          <mat-icon>file_download</mat-icon>
        </button>
      }
      <button mat-icon-button
              matTooltip="show only playing games"
              (click)="togglePlaying()">
        <mat-icon>{{ (playing$|async)?'edit':'edit_off' }}</mat-icon>
      </button>
      <button mat-icon-button
              matTooltip="Choose used algorithms filter"
              [matBadge]="(algCount$|async)+''"
              [matBadgeHidden]="((algCount$|async)||0)<1"
              [matMenuTriggerFor]="algmenu">
        <mat-icon>fact_check</mat-icon>
      </button>
      <div fxFlex></div>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button
              [disabled]="!(activeSchema$|async)"
              (click)="select()"
      >Load</button>
      <!-- MENU POPUP DEGLI ALGORITMI -->
      <mat-menu #algmenu="matMenu">
        @for (alg of availableAlgorithms; track $index) {
          <button mat-menu-item
                  [class.active]="((algorithms$|async)||[]).includes(alg.id)"
                  (click)="toggleAlg(alg)">
            <mat-icon>{{alg.icon}}</mat-icon>
            <span>{{alg.name}}</span>
          </button>
        }
      </mat-menu>
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
  playing$: BehaviorSubject<boolean>;
  algorithms$: BehaviorSubject<string[]>;
  algCount$: Observable<number>;
  availableAlgorithms: Algorithm[];
  schemas$: BehaviorSubject<Sudoku[]>;

  constructor() {
    this.activeSchema$ = new BehaviorSubject<Sudoku|undefined>(undefined);
    this.playing$ = new BehaviorSubject<boolean>(false);
    this.algorithms$ = new BehaviorSubject<string[]>([]);
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);

    this.algCount$ = this.algorithms$.pipe(map(algs => (algs||[]).length));
    this.availableAlgorithms = getAlgorithms();
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

  togglePlaying() {
    this.playing$.next(!this.playing$.value);
  }

  toggleAlg(alg: Algorithm) {
    const algs = [...this.algorithms$.value];
    if (algs.includes(alg.id)) {
      _remove(algs, a => a === alg.id);
    } else {
      algs.push(alg.id);
    }
    this.algorithms$.next(algs);
  }

  setSchemaList(sdks?: Sudoku[]) {
    this.schemas$.next(sdks||[])
  }
}
