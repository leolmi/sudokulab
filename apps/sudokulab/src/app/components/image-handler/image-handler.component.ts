import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HandleImageOptions, HandleImageResult, ImgDto, OcrResult, Sudoku, SudokuFacade } from '@sudokulab/model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Rect } from './crop-area.component';
import { map, switchMap, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { checkImageSize, getRectDto } from '../../utils/image.utils';

@Component({
  selector: 'sudokulab-image-handler',
  templateUrl: './image-handler.component.html',
  styleUrls: ['./image-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageHandlerComponent {
  rotationValue$: BehaviorSubject<number>;
  crop$: BehaviorSubject<Rect>;
  rotationDeg$: Observable<number>;
  style$: Observable<any>;
  maxRotation = 2000;
  working$: BehaviorSubject<boolean>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageOptions,
              private _sudoku: SudokuFacade,
              private _http: HttpClient,
              private _dialogRef: MatDialogRef<ImageHandlerComponent>) {
    this.rotationValue$ = new BehaviorSubject<number>(this.maxRotation / 2);
    this.crop$ = new BehaviorSubject<Rect>({ x:0, y:0, h:0, w:0 });
    this.rotationDeg$ = this.rotationValue$.pipe(map(r => Math.floor((r * 360) / this.maxRotation - 180)));
    this.working$ = new BehaviorSubject<boolean>(false);

    this.style$ = this.rotationDeg$.pipe(map(deg => ({
      transform: `rotate(${deg}deg);`
    })));
  }

  setRotation(e: any) {
    this.rotationValue$.next(e.value);
  }

  cropChanged(e: Rect) {
    this.crop$.next(e);
  }

  done() {
    this.working$.next(true);
    combineLatest(this.rotationDeg$, this.crop$)
      .pipe(
        take(1),
        switchMap(([rotation, crop]) => checkImageSize(this.data.image)
          .pipe(switchMap(image => this._http.post<any>('/api/sudoku/ocr', <ImgDto>{
            data: image,
            rect: getRectDto(crop),
            rotation
          })))
        ))
      .subscribe((resp: OcrResult) => {
        this.working$.next(false);
        const sdk = new Sudoku({ fixed: resp.values });
        this._dialogRef.close(new HandleImageResult({ sdk, onlyValues: this.data.onlyValues }));
      }, (err) => {
        console.error('Error while processing image', err);
        this.working$.next(false);
      })
  }
}



