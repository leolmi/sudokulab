import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, catchError, combineLatest, firstValueFrom, map, Observable, of } from 'rxjs';
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
  OcrScanDoubt,
  OcrScanMap,
  OcrScanResult,
  Quad,
  SDK_PREFIX,
  SolveOptions,
  stopEvent,
  Sudoku,
  ValueOptions
} from '@olmi/model';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';
import { OcrDoubtsComponent, OcrImageCropComponent, OcrMapWrapper } from '@olmi/ocr-components';
import { SUDOKU_API, SUDOKU_NOTIFIER } from '@olmi/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { getSolutionByStat, getWorkStat, solve } from '@olmi/logic';

enum KeeperMode {
  chooser = 'chooser',
  text = 'text',
  file = 'file',
  schema = 'schema',
  image = 'image',
  imageCrop = 'image-crop',
  doubts = 'doubts',
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
    OcrImageCropComponent,
    MatProgressSpinner,
    OcrDoubtsComponent
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
  keeperMode$: BehaviorSubject<KeeperMode>;
  text$: BehaviorSubject<string>;
  image$: BehaviorSubject<string>;
  crop$: BehaviorSubject<Quad>;
  dragging$: BehaviorSubject<boolean>;
  loading$: BehaviorSubject<boolean>;
  inDoubts$: BehaviorSubject<OcrScanDoubt[]>;
  outDoubts$: BehaviorSubject<OcrMapWrapper[]>;

  manager: BoardManager | undefined;
  toolbarTemplate = 'nums,clear,delete';

  chooserButtons: ChooserButton[] = [
    { mode: KeeperMode.schema, icon: 'grid_on', title: 'Schema' },
    { mode: KeeperMode.text, icon: 'money', title: 'String of numbers' },
    { mode: KeeperMode.file, icon: 'description', title: 'Import json file' },
    { mode: KeeperMode.image, icon: 'image', title: 'Scan image', disabled: true },
  ];
  textLength$: Observable<number>;
  valid$: Observable<boolean>;

  constructor() {
    this.keeperMode$ = new BehaviorSubject<KeeperMode>(KeeperMode.chooser);
    this.loading$ = new BehaviorSubject<boolean>(false);
    this.dragging$ = new BehaviorSubject<boolean>(false);
    this.text$ = new BehaviorSubject<string>('');
    this.image$ = new BehaviorSubject<string>('');
    this.crop$ = new BehaviorSubject<Quad>(new Quad());
    this.inDoubts$ = new BehaviorSubject<OcrScanDoubt[]>([]);
    this.outDoubts$ = new BehaviorSubject<OcrMapWrapper[]>([]);

    this.textLength$ = this.text$.pipe(map(t => `${t||''}`.length));
    this.valid$ = combineLatest([this.keeperMode$, this.text$, this.image$, this.outDoubts$]).pipe(map(
      ([mode, text, img, dbts]: [KeeperMode, string, string, any[]]) => {
        switch (mode) {
          case KeeperMode.imageCrop:
            return !!img;
          case KeeperMode.doubts:
            return (dbts || []).length > 0;
          default:
            return isSchemaString(text);
        }
      }));
  }

  private _reset() {
    this.text$.next('');
    this.crop$.next(new Quad());
    this.inDoubts$.next([]);
    this.outDoubts$.next([]);
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
      case KeeperMode.image:
      case KeeperMode.file:
        this.import();
        break;
    }
  }

  private _importFromFiles(files: any) {
    let file = getFirstJsonFile(files);
    if (!!file) return getSudokuByFile(file, (sdk) => this._dialogRef.close(sdk.values));
    file = getFirstImageFile(files);
    if (file) return getImageByFile(file, (img) => {
      if (img) {
        this.image$.next(img);
        this.setMode(KeeperMode.imageCrop);
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

  private _manageScanResult(res?: OcrScanResult) {
    if (!res) return this.setMode();
    if ((res.doubts||[]).length>0) {
      this.inDoubts$.next(res.doubts);
      this.setMode(KeeperMode.doubts);
    } else if (res.values) {
      this.text$.next(res.values);
      this.setMode(KeeperMode.schema);
    }
  }

  private _manageScan() {
    this.loading$.next(true);
    this._interaction
      .ocrScan({
        data: this.image$.value,
        crop: this.crop$.value
      })
      .pipe(catchError(err => {
        console.error('error while scan image', err);
        return of(undefined);
      }))
      .subscribe(res => {
        this.loading$.next(false);
        this._manageScanResult(res);
      })
  }

  private async _manageDoubts() {
    this.loading$.next(true);
    // invia le interpretazioni al server
    const maps = this.outDoubts$.value;
    for (const m of maps) {
      await firstValueFrom(this._interaction.ocrMap(<OcrScanMap>m));
    }
    // parte nuovamente lo scan
    this._manageScan();
  }

  updateCrop(q: Quad) {
    this.crop$.next(q);
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
      this.import();
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
      case KeeperMode.imageCrop:
        this._manageScan();
        break;
      case KeeperMode.doubts:
        this._manageDoubts();
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

  import() {
    if (!!this.fileResource) this.fileResource.nativeElement.click();
  }

  keepText(e: any) {
    this.text$.next(e.target.value||'');
  }

  protected readonly DEFAULT_TOTAL_RANK = DEFAULT_TOTAL_RANK;
  protected readonly KeeperMode = KeeperMode;
}

