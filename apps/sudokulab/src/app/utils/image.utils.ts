import { Rect } from '../components/image-handler/crop-area.component';
import { RectangleDto } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';

export const MAX_IMAGE_SIZE = 1240;

export const checkImageSize = (image: string, max = MAX_IMAGE_SIZE): Observable<string> =>
  fromPromise(resizeImage(image, max))

export const resizeImage = (base64: string, max = MAX_IMAGE_SIZE): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const w = img.width||0;
      const h = img.height||0;
      const rdm = w/h;
      if (Math.max(w, h)>max) {
        const nw = rdm > 1 ? max : Math.floor(max * rdm);
        const nh = rdm > 1 ? Math.floor(max / rdm) : max;
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        const ctx: CanvasDrawImage = <CanvasDrawImage>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, nw, nh);
        resolve(canvas.toDataURL());
      } else {
        resolve(base64);
      }
    }
    img.onerror = err => reject(err);
  })
}

export const getRectDto = (crop: Rect): RectangleDto => {
  return {
    left: crop.x,
    top: crop.y,
    width: crop.w,
    height: crop.h
  }
}
