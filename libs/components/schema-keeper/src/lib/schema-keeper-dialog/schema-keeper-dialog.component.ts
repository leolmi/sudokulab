import { Component, ElementRef, Inject, inject, Optional, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { BoardComponent, BoardManager, BoardStatus } from '@olmi/board';
import {
  DEFAULT_TOTAL_RANK,
  getCellsSchema,
  getFirstImageFile,
  getFirstJsonFile,
  getImageByFile,
  getSudokuByFile,
  isSchemaString,
  LocalContext,
  NotificationType,
  SDK_PREFIX,
  SolveOptions,
  stopEvent,
  Sudoku,
  ValueOptions
} from '@olmi/model';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';
import { SUDOKU_API, SUDOKU_NOTIFIER } from '@olmi/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { getSolutionByStat, getWorkStat, solve } from '@olmi/logic';

enum KeeperMode {
  chooser = 'chooser',
  text = 'text',
  file = 'file',
  schema = 'schema',
  imagePreview = 'image-preview',
}

interface ChooserButton {
  mode: KeeperMode;
  icon: string;
  title: string;
  disabled?: boolean;
}

@Component({
  selector: 'schema-keeper',
  imports: [
    CommonModule,
    FlexModule,
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    BoardComponent,
    SchemaToolbarComponent,
    MatProgressSpinner,
  ],
  templateUrl: './schema-keeper-dialog.component.html',
  styleUrl: './schema-keeper-dialog.component.scss',
  standalone: true
})
export class SchemaKeeperDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<SchemaKeeperDialogComponent>);
  private readonly _interaction = inject(SUDOKU_API);
  private readonly _notifier = inject(SUDOKU_NOTIFIER);
  protected readonly localContext = LocalContext;
  @ViewChild('textInput') textInput: ElementRef|undefined;
  @ViewChild('fileResource') fileResource: ElementRef|undefined;
  @ViewChild('imageResource') imageResource: ElementRef|undefined;
  keeperMode$: BehaviorSubject<KeeperMode>;
  text$: BehaviorSubject<string>;
  image$: BehaviorSubject<string>;
  dragging$: BehaviorSubject<boolean>;
  loading$: BehaviorSubject<boolean>;

  manager: BoardManager | undefined;
  toolbarTemplate = 'nums,clear,delete';

  chooserButtons: ChooserButton[] = [
    { mode: KeeperMode.schema, icon: 'grid_on', title: 'Schema' },
    { mode: KeeperMode.text, icon: 'money', title: 'String of numbers' },
    { mode: KeeperMode.file, icon: 'description', title: 'Import json file' },
    { mode: KeeperMode.imagePreview, icon: 'image', title: 'Scan image' },
  ];
  textLength$: Observable<number>;
  valid$: Observable<boolean>;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data?: { values?: string }) {
    const presetValues = (data?.values || '').trim();
    this.keeperMode$ = new BehaviorSubject<KeeperMode>(presetValues ? KeeperMode.schema : KeeperMode.chooser);
    this.loading$ = new BehaviorSubject<boolean>(false);
    this.dragging$ = new BehaviorSubject<boolean>(false);
    this.text$ = new BehaviorSubject<string>(presetValues);
    this.image$ = new BehaviorSubject<string>('');

    this.textLength$ = this.text$.pipe(map(t => `${t||''}`.length));
    this.valid$ = combineLatest([this.keeperMode$, this.text$, this.image$]).pipe(map(
      ([mode, text, img]: [KeeperMode, string, string]) => {
        switch (mode) {
          case KeeperMode.imagePreview:
            return !!img;
          default:
            return isSchemaString(text);
        }
      }));
  }

  private _reset() {
    this.text$.next('');
    this.image$.next('');
    this.loading$.next(false);
    this.dragging$.next(false);
  }

  private _onChangeMode() {
    switch (this.keeperMode$.value) {
      case KeeperMode.chooser:
        this._reset();
        break;
      case KeeperMode.text:
        setTimeout(() => this.textInput?.nativeElement.focus(), 250);
        break;
      case KeeperMode.file:
        this.importFile();
        break;
      case KeeperMode.imagePreview:
        this._pickImage();
        break;
    }
  }

  private _pickImage() {
    if (this.imageResource) {
      this.imageResource.nativeElement.click();
    }
  }

  onImageChange(e: any) {
    const files = e.target?.files;
    const file = getFirstImageFile(files);
    // Reset input per consentire di selezionare lo stesso file
    if (this.imageResource) this.imageResource.nativeElement.value = '';
    if (file) {
      getImageByFile(file, (img) => {
        if (img) {
          this.image$.next(img);
        } else {
          this.setMode();
        }
      });
    } else {
      // Utente ha annullato la selezione
      this.setMode();
    }
  }

  private _importFromFiles(files: any) {
    let file = getFirstJsonFile(files);
    if (file) return getSudokuByFile(file, (sdk) => this._dialogRef.close(sdk.values));
    file = getFirstImageFile(files);
    if (file) return getImageByFile(file, (img) => {
      if (img) {
        this.image$.next(img);
        this.setMode(KeeperMode.imagePreview);
      } else {
        this.setMode();
      }
    });
    this.setMode();
  }

  private _initBoard() {
    if (this.manager) {
      const o = <ValueOptions>{
        editMode: 'schema',
        isDynamic: false,
        nextMode: 'next-in-row'
      };
      this.manager.options(<Partial<BoardStatus>>o);
      if (this.text$.value) this.manager.load(this.text$.value);
      this.manager.cells$.subscribe(cells =>
        this.text$.next(getCellsSchema(cells, o)));    }
  }

  private _manageScanResult(res?: any) {
    if (!res) return this.setMode();
    if (res.values) {
      this.text$.next(res.values);
      this.setMode(KeeperMode.schema);
    }
  }

  private _manageScan() {
    this.loading$.next(true);
    this._interaction
      .ocrScan({ data: this.image$.value })
      .pipe(catchError(err => {
        console.error('error while scan image', err);
        return of(undefined);
      }))
      .subscribe(res => {
        this.loading$.next(false);
        this._manageScanResult(res);
      })
  }

  allowDrop(e: any) {
    this.dragging$.next(true);
    e.preventDefault();
    const enabled = (<HTMLElement>e.target)?.classList.contains('drop-enabled');
    const file = getFirstJsonFile(e.dataTransfer?.items);
    e.dataTransfer.dropEffect = (!!file && enabled) ? 'copy' : 'none';
  }

  dragExit() {
    this.dragging$.next(false)
  }

  onFileChange(e: any) {
    stopEvent(e);
    this._importFromFiles((e.dataTransfer || e.target).files);
    (<HTMLInputElement>this.fileResource?.nativeElement).value = '';
  }

  drop(e: any) {
    stopEvent(e);
    this.dragExit();
    this._importFromFiles(e.dataTransfer?.files);
  }

  boardReady(manager: BoardManager) {
    if (!this.manager) {
      this.manager = manager;
      this._initBoard();
    }
  }

  setMode(mode?: KeeperMode) {
    if (mode === KeeperMode.file) {
      this.importFile();
    } else {
      this.keeperMode$.next(mode || KeeperMode.chooser);
      this._onChangeMode();
    }
  }

  get schema() {
    return `${this.text$.value||''}`.trim().toLowerCase();
  }

  load() {
    switch (this.keeperMode$.value) {
      case KeeperMode.imagePreview:
        this._manageScan();
        break;
      default:
        console.log(...SDK_PREFIX, 'try to load schema', this.schema);
        this._dialogRef.close(this.schema);
        break;
    }
  }

  testSolve() {
    const values = this.schema;
    const sdk = new Sudoku({ values })
    const options = new SolveOptions({
      useTryAlgorithm: true,
      debug: true
    });
    const res = solve(sdk, options);
    const stat = getWorkStat(res);
    const sol = getSolutionByStat(stat);
    console.log('RESULTS', res, '\n\tSTAT', stat, '\n\tSOLUTION', sol);
    if (sol) {
      this._notifier.notify('solution found', NotificationType.success);
    } else {
      this._notifier.notify('No solution found', NotificationType.error);
    }
  }

  importFile() {
    if (this.fileResource) this.fileResource.nativeElement.click();
  }

  keepText(e: any) {
    this.text$.next(e.target.value||'');
  }

  protected readonly DEFAULT_TOTAL_RANK = DEFAULT_TOTAL_RANK;
  protected readonly KeeperMode = KeeperMode;
}
