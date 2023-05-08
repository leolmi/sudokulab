import {ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {HandleImageOptions, HandleImageResult, ImgDto, OcrResult, Sudoku, SudokuFacade} from '@sudokulab/model';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {CropInfo} from './image-handler.model';
import {map, switchMap, take} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {checkImageSize} from '../../utils/image.utils';
import {drawShapeToCanvas, ShapeToCanvasCorrection} from "./image-handler.helper";
import {cloneDeep as _clone} from 'lodash';


@Component({
  selector: 'sudokulab-image-handler',
  templateUrl: './image-handler.component.html',
  styleUrls: ['./image-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageHandlerComponent {
  @ViewChild('context') targetContext?: ElementRef;
  crop$: BehaviorSubject<CropInfo>;
  working$: BehaviorSubject<boolean>;
  correction$: BehaviorSubject<ShapeToCanvasCorrection>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageOptions,
              private _sudoku: SudokuFacade,
              private _http: HttpClient,
              private _dialogRef: MatDialogRef<ImageHandlerComponent>) {
    this.crop$ = new BehaviorSubject<CropInfo>(new CropInfo());
    this.working$ = new BehaviorSubject<boolean>(false);
    this.correction$ = new BehaviorSubject<ShapeToCanvasCorrection>(new ShapeToCanvasCorrection());
    combineLatest([this.correction$, this.crop$]).subscribe(() => this.preview());
  }

  cropChanged(e: CropInfo) {
    this.crop$.next(e);
  }

  done() {
    this.working$.next(true);
    const canvas = (<HTMLCanvasElement>this.targetContext?.nativeElement);
    const data = canvas.toDataURL();
    this._http.post<any>('/api/sudoku/ocr', <ImgDto>{data})
      .subscribe((resp: OcrResult) => {
        this.working$.next(false);
        const sdk = new Sudoku({fixed: resp.values});
        this._dialogRef.close(new HandleImageResult({sdk, onlyValues: this.data.onlyValues}));
      }, (err) => {
        console.error('Error while processing image', err);
        this.working$.next(false);
      });
  }

  preview() {
    const canvas = (<HTMLCanvasElement>this.targetContext?.nativeElement);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.crop$.pipe(
      take(1),
      switchMap((crop) => checkImageSize(this.data.image)
        .pipe(map(resize => ({ crop, img: resize.img })))))
        .subscribe(r => drawShapeToCanvas(r.img, ctx, r.crop, this.correction$.value));
  }

  onValueChange(e: any, target: string) {
    const cr = _clone(this.correction$.value);
    (<any>cr)[target] = parseFloat(e.target.value);
    this.correction$.next(cr);
  }
}



