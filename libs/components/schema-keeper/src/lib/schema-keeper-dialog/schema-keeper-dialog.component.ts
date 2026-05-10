import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
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
} from '@olmi/model';
import { SchemaToolbarComponent } from '@olmi/schema-toolbar';
import { SUDOKU_API, SUDOKU_NOTIFIER } from '@olmi/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatTooltip } from '@angular/material/tooltip';
import { getSolutionByStat, getWorkStat, solve } from '@olmi/logic';

const ROTATION_RANGE = 45;

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
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    BoardComponent,
    SchemaToolbarComponent,
    MatProgressSpinner,
    MatSlider,
    MatSliderThumb,
    MatTooltip,
  ],
  templateUrl: './schema-keeper-dialog.component.html',
  styleUrl: './schema-keeper-dialog.component.scss',
  providers: [BoardManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaKeeperDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<SchemaKeeperDialogComponent>);
  private readonly _interaction = inject(SUDOKU_API);
  private readonly _notifier = inject(SUDOKU_NOTIFIER);
  private readonly _data = inject<{ values?: string } | null>(MAT_DIALOG_DATA, { optional: true });
  protected readonly manager = inject(BoardManager);

  protected readonly localContext = LocalContext;
  protected readonly DEFAULT_TOTAL_RANK = DEFAULT_TOTAL_RANK;
  protected readonly KeeperMode = KeeperMode;
  protected readonly ROTATION_RANGE = ROTATION_RANGE;

  protected readonly textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');
  protected readonly fileResource = viewChild<ElementRef<HTMLInputElement>>('fileResource');
  protected readonly imageResource = viewChild<ElementRef<HTMLInputElement>>('imageResource');

  private readonly _presetValues = (this._data?.values || '').trim();

  protected readonly keeperMode = signal<KeeperMode>(
    this._presetValues ? KeeperMode.schema : KeeperMode.chooser,
  );
  protected readonly text = signal<string>(this._presetValues);
  protected readonly image = signal<string>('');
  protected readonly dragging = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly rotation = signal<number>(0);
  protected readonly rotationOrthogonal = signal<number>(0);

  protected readonly rotationTotal = computed(() => this.rotation() + this.rotationOrthogonal());
  protected readonly textLength = computed(() => `${this.text() || ''}`.length);
  protected readonly valid = computed(() => {
    if (this.keeperMode() === KeeperMode.imagePreview) return !!this.image();
    return isSchemaString(this.text());
  });

  protected readonly isDebugMode = LocalContext.isDebugMode;

  protected readonly toolbarTemplate = 'nums,clear,delete';

  protected readonly chooserButtons: ChooserButton[] = [
    { mode: KeeperMode.schema, icon: 'grid_on', title: 'Schema' },
    { mode: KeeperMode.text, icon: 'money', title: 'String of numbers' },
    { mode: KeeperMode.file, icon: 'description', title: 'Import json file' },
    { mode: KeeperMode.imagePreview, icon: 'image', title: 'Scan image' },
  ];

  constructor() {
    // configurazione iniziale del manager (one-shot)
    this.manager.options(<Partial<BoardStatus>>{
      editMode: 'schema',
      isDynamic: false,
      nextMode: 'next-in-row',
    });
    if (this._presetValues) this.manager.load(this._presetValues);

    // sincronizza `text` con le cells del manager: ogni volta che le cells
    // cambiano (utente che edita la board nel keeper schema) ricalcola la
    // stringa schema. Limitato alla sola modalità `schema`: nelle altre
    // (chooser/text/imagePreview) il signal è gestito dall'input utente o dal
    // reset, e farlo coincidere con la stringa-celle (81 zeri all'init) farebbe
    // mostrare "81/81" nel counter dell'input vuoto.
    effect(() => {
      const cells = this.manager.cells();
      if (untracked(() => this.keeperMode()) !== KeeperMode.schema) return;
      this.text.set(getCellsSchema(cells));
    });
  }

  private _reset() {
    this.text.set('');
    this.image.set('');
    this.loading.set(false);
    this.dragging.set(false);
    this._resetRotation();
  }

  private _resetRotation() {
    this.rotation.set(0);
    this.rotationOrthogonal.set(0);
  }

  private _onChangeMode() {
    switch (this.keeperMode()) {
      case KeeperMode.chooser:
        this._reset();
        break;
      case KeeperMode.text:
        setTimeout(() => this.textInput()?.nativeElement.focus(), 250);
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
    this.imageResource()?.nativeElement.click();
  }

  onImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    const file = getFirstImageFile(files);
    // Reset input per consentire di selezionare lo stesso file
    const imageEl = this.imageResource()?.nativeElement;
    if (imageEl) imageEl.value = '';
    if (file) {
      getImageByFile(file, (img) => {
        if (img) {
          this._resetRotation();
          this.image.set(img);
        } else {
          this.setMode();
        }
      });
    } else {
      // Utente ha annullato la selezione
      this.setMode();
    }
  }

  setRotation(value: number) {
    this.rotation.set(value);
  }

  rotateOrthogonal(delta: number) {
    this.rotationOrthogonal.update(v => (v + delta) % 360);
  }

  resetRotation() {
    this._resetRotation();
  }

  private _rotateImage(dataUrl: string, angle: number): Promise<string> {
    const normalized = ((angle % 360) + 360) % 360;
    if (normalized === 0) return Promise.resolve(dataUrl);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const rad = (normalized * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * cos + h * sin);
        canvas.height = Math.round(w * sin + h * cos);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  private _importFromFiles(files: FileList | null | undefined) {
    let file = getFirstJsonFile(files);
    if (file) return getSudokuByFile(file, (sdk) => this._dialogRef.close(sdk.values));
    file = getFirstImageFile(files);
    if (file) return getImageByFile(file, (img) => {
      if (img) {
        this.image.set(img);
        this.setMode(KeeperMode.imagePreview);
      } else {
        this.setMode();
      }
    });
    this.setMode();
  }

  private _manageScanResult(res?: { values?: string }) {
    if (!res) return this.setMode();
    if (res.values) {
      this.text.set(res.values);
      this.setMode(KeeperMode.schema);
    }
  }

  private async _manageScan() {
    this.loading.set(true);
    const angle = this.rotation() + this.rotationOrthogonal();
    const data = await this._rotateImage(this.image(), angle);
    let res: { values?: string } | undefined;
    try {
      res = await this._interaction.ocrScan({ data });
    } catch (err) {
      console.error('error while scan image', err);
    }
    this.loading.set(false);
    this._manageScanResult(res);
  }

  allowDrop(e: DragEvent) {
    this.dragging.set(true);
    e.preventDefault();
    const enabled = (<HTMLElement>e.target)?.classList.contains('drop-enabled');
    const file = getFirstJsonFile(e.dataTransfer?.items);
    if (e.dataTransfer) e.dataTransfer.dropEffect = (!!file && enabled) ? 'copy' : 'none';
  }

  dragExit() {
    this.dragging.set(false);
  }

  onFileChange(e: Event) {
    stopEvent(e);
    const input = e.target as HTMLInputElement;
    this._importFromFiles(input.files);
    const fileEl = this.fileResource()?.nativeElement;
    if (fileEl) fileEl.value = '';
  }

  drop(e: DragEvent) {
    stopEvent(e);
    this.dragExit();
    this._importFromFiles(e.dataTransfer?.files);
  }

  setMode(mode?: KeeperMode) {
    if (mode === KeeperMode.file) {
      this.importFile();
    } else {
      this.keeperMode.set(mode || KeeperMode.chooser);
      this._onChangeMode();
    }
  }

  get schema() {
    return `${this.text() || ''}`.trim().toLowerCase();
  }

  load() {
    switch (this.keeperMode()) {
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
    const sdk = new Sudoku({ values });
    const options = new SolveOptions({
      useTryAlgorithm: true,
      debug: true,
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
    this.fileResource()?.nativeElement.click();
  }

  keepText(e: Event) {
    const input = e.target as HTMLInputElement;
    this.text.set(input.value || '');
  }
}
