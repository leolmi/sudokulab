import {ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {
  checkImportText,
  getHash,
  ImportOptions,
  MessageType,
  Sudoku, SUDOKU_DEFAULT_RANK,
  SudokuLab,
  SudokuMessage,
  use
} from '@sudokulab/model';


@Component({
  selector: 'sudokulab-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadDialogComponent {
  @ViewChild('fileResource') fileResource: ElementRef|undefined = undefined;
  text$: BehaviorSubject<string>;
  textInfo$: Observable<string>;
  valid$: Observable<boolean>;
  onlyValues$: BehaviorSubject<boolean>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ImportOptions,
              public sudokuLab: SudokuLab,
              private _dialogRef: MatDialogRef<UploadDialogComponent>) {
    this.text$ = new BehaviorSubject<string>('');
    this.onlyValues$ = new BehaviorSubject<boolean>(false);

    const textLenght$ = this.text$.pipe(map(txt => checkImportText(txt, { partial: true }).length));
    this.textInfo$ = textLenght$.pipe(map(ln => `${ln} characthers`));
    this.valid$ = textLenght$.pipe(map(ln => ln === (SUDOKU_DEFAULT_RANK*SUDOKU_DEFAULT_RANK)));
  }

  private _upload(sdk: Sudoku) {
    this._dialogRef.close(new ImportOptions({ sdk, onlyValues: this.onlyValues$.value }));
  }

  private _image(image: string) {
    this._dialogRef.close(new ImportOptions({ image, onlyValues: this.onlyValues$.value }));
  }

  editOnGrid() {
    this._dialogRef.close(new ImportOptions({ editOnGrid: true, onlyValues: this.onlyValues$.value }));
  }

  applyText(e: any) {
    if (!e?.target) return;
    this.text$.next((<HTMLInputElement>e?.target).value);
  }

  import() {
    if (!!this.fileResource) this.fileResource.nativeElement.click();
  }

  upload() {
    use(this.text$, txt => {
      const sudoku = new Sudoku({ fixed: checkImportText(txt) });
      this._upload(sudoku);
    });
  }

  onlyValuesChanged(e: any) {
    this.onlyValues$.next(e.checked);
  }

  private _readJsonFile(file: any) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json: Sudoku = <Sudoku>JSON.parse(<string>reader.result);
        const fixed = checkImportText(json.fixed);
        const values = checkImportText(json.values);
        const sudoku = new Sudoku({
          _id: json._id||getHash(fixed),
          fixed,
          values,
          rank: json.rank,
          options: json.options,
          info: json.info
        });
        this._upload(sudoku);
      } catch (err) {
        this.sudokuLab.raiseError(err);
      }
    };
    reader.onerror = (err) => this.sudokuLab.raiseError(err);
    reader.readAsText(file);
  }

  private _readImageFile(file: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        //console.log('IMAGE DATA', <string>reader.result);
        this._image(<string>reader.result);
      } catch (err) {
        this.sudokuLab.raiseError(err);
      }
    };
    reader.onerror = (err) => {
      this.sudokuLab.raiseError(err);
    }
    reader.readAsDataURL(file);
  }

  private _checkFile(file: any, e?: any) {
    if (!file) return;
    if (isImageType(file?.type) && this.data.allowImages) {
      this._readImageFile(file);
    } else if (isJsonType(file?.type)) {
      this._readJsonFile(file);
    } else {
      if (!!e) e.target.value = '';
      return this.sudokuLab.showMessage(new SudokuMessage({
        message: 'Invalid file!',
        type: MessageType.error
      }));
    }
  }

  onFileChange(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const files = (e.dataTransfer || e.target).files;
    this._checkFile(files[0], e);
  }

  allowDrop(e: any) {
    e.preventDefault();
    const enabled = (<HTMLElement>e.target)?.classList.contains('drop-enabled');
    const file = Array.from(e.dataTransfer?.items||[]).find((i: any) => !!i && i.kind === 'file' && isAvailableType(i.type));
    e.dataTransfer.dropEffect = (!!file && enabled) ? 'copy' : 'none';
  }
  drop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const file = Array.from(e.dataTransfer?.files||[]).find((i: any) => !!i && isAvailableType(i.type));
    this._checkFile(file);
  }

}

const isImageType = (type: string): boolean => {
  return ['image/png','image/jpg','image/jpeg','image/bmp'].indexOf(type)>-1
}

const isJsonType = (type: string): boolean => {
  return type === 'application/json';
}

const isAvailableType = (type: string): boolean => {
  return isImageType(type) || isJsonType(type);
}
