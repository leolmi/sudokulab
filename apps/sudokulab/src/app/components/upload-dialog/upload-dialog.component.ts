import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  getHash,
  MessageType,
  Sudoku,
  SudokuFacade,
  SudokuMessage,
  UploadDialogOptions,
  UploadDialogResult,
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: UploadDialogOptions,
              private _sudoku: SudokuFacade,
              private _dialogRef: MatDialogRef<UploadDialogComponent>) {
    this.text$ = new BehaviorSubject<string>('');
    this.onlyValues$ = new BehaviorSubject<boolean>(false);

    const textLenght$ = this.text$.pipe(map(txt => (txt || '').replace(/\s/g, '').length));
    this.textInfo$ = textLenght$.pipe(map(ln => `${ln} characthers`));
    this.valid$ = textLenght$.pipe(map(ln => ln > 0));
  }

  private _upload(sdk: Sudoku) {
    this._sudoku.upload(false);
    this._dialogRef.close(new UploadDialogResult({ sdk, onlyValues: this.onlyValues$.getValue() }));
  }

  private _image(image: string) {
    this._sudoku.upload(false);
    this._dialogRef.close(new UploadDialogResult({ image, onlyValues: this.onlyValues$.getValue() }));
  }

  editOnGrid() {
    this._sudoku.upload(false);
    this._dialogRef.close(new UploadDialogResult({ editOnGrid: true, onlyValues: this.onlyValues$.getValue() }));
  }

  applyText(e: any) {
    if (!e?.target) return;
    this.text$.next((<HTMLInputElement>e?.target).value);
  }

  import() {
    if (!!this.fileResource) this.fileResource.nativeElement.click();
  }

  upload() {
    use(this.text$, fixed => {
      const sudoku = new Sudoku({ fixed });
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
        const sudoku = new Sudoku({
          _id: json._id||getHash(json.fixed),
          fixed: json.fixed,
          values: json.values||'',
          rank: json.rank,
          options: json.options,
          info: json.info
        });
        this._upload(sudoku);
      } catch (err) {
        this._sudoku.raiseError(err);
      }
    };
    reader.onerror = (err) => this._sudoku.raiseError(err);
    reader.readAsText(file);
  }

  private _readImageFile(file: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this._image(<string>reader.result);
      } catch (err) {
        this._sudoku.raiseError(err);
      }
    };
    reader.onerror = (err) => {
      this._sudoku.raiseError(err);
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
      return this._sudoku.raiseMessage(new SudokuMessage({
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
