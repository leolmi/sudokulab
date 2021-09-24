import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LabFacade, MessageType, Sudoku, SudokuFacade, SudokuMessage, use } from '@sudokulab/model';

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
              private _sudoku: SudokuFacade,
              private _dialogRef: MatDialogRef<UploadDialogComponent>) {
    this.text$ = new BehaviorSubject<string>('');

    const textLenght$ = this.text$.pipe(map(txt => (txt || '').replace(/\s/g, '').length));
    this.textInfo$ = textLenght$.pipe(map(ln => `${ln} characthers`));
    this.valid$ = textLenght$.pipe(map(ln => ln > 0));
  }

  private _upload(sdk: Sudoku) {
    this._sudoku.upload(false);
    this._dialogRef.close(sdk);
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

  private _readFile(file: any) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json: Sudoku = <Sudoku>JSON.parse(<string>reader.result);
        const sudoku = new Sudoku({
          fixed: json.fixed,
          values: json.values||'',
          rank: json.rank,
          id: json.id||json.fixed,
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

  onFileChange(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const files = (e.dataTransfer || e.target).files;
    const file = files[0];
    if (!/(.*)(.json)$/i.test(file.name)) {
      e.target.value = '';
      return this._sudoku.raiseMessage(new SudokuMessage({
        message: 'Invalid file!',
        type: MessageType.error
      }));
    } else {
      this._readFile(file);
    }
  }

  allowDrop(e: any) {
    e.preventDefault();
    const enabled = (<HTMLElement>e.target)?.classList.contains('drop-enabled');
    const file = Array.from(e.dataTransfer?.items||[]).find((i: any) => !!i && i.kind === 'file' && i.type === 'application/json');
    e.dataTransfer.dropEffect = (!!file && enabled) ? 'copy' : 'none';
  }
  drop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const file = Array.from(e.dataTransfer?.files||[]).find((i: any) => !!i && i.type === 'application/json');
    if (!!file) this._readFile(file);
  }
}
