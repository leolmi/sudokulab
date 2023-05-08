import {CropInfo} from '../components/image-handler/image-handler.model';
import {AreaDto, ShapeDto} from '@sudokulab/model';
import {Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';

export const MAX_IMAGE_SIZE = 1240;


export interface ResizeImageResult {
  img: any,
  data: string;
}

export const checkImageSize = (image: string, max = MAX_IMAGE_SIZE): Observable<ResizeImageResult> =>
  fromPromise(resizeImage(image, max))


export const resizeImage = (base64: string, max = MAX_IMAGE_SIZE): Promise<ResizeImageResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const w = img.width||0;
      const h = img.height||0;
      const rdm = w/h;
      // console.log('IMAGE SIZE w=', w, '   h=', h, '  rdm=', rdm);
      if (Math.max(w, h)>max) {
        const nw = rdm > 1 ? max : Math.floor(max * rdm);
        const nh = rdm > 1 ? Math.floor(max / rdm) : max;
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        // console.log('IMAGE SIZE w=', w, '   h=', h, '  rdm=', rdm);
        const ctx: CanvasDrawImage = <CanvasDrawImage>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, nw, nh);
        resolve({img, data: canvas.toDataURL()});
      } else {
        resolve({img, data: base64});
      }
    }
    img.onerror = err => reject(err);
  })
}

export const getShapeDto = (crop: CropInfo): ShapeDto => {
  return {
    tl: crop.shape.tl,
    tr: crop.shape.tr,
    bl: crop.shape.bl,
    br: crop.shape.br
  }
}

export const getAreaDto = (crop: CropInfo): AreaDto => {
  return {
    w: crop.area.w,
    h: crop.area.h
  }
}
