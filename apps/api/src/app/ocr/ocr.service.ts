import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { Injectable } from '@nestjs/common';
import { OcrContext } from '../../model/ocr.model';
import { OcrResult } from '../../model/ocr.result';
import { preProcessImage, scanCells, splitImage } from './ocr.helper';


@Injectable()
export class OcrService {

  async ocr(img: ImgDto, options?: OcrOptions): Promise<OcrResult> {
    const context = new OcrContext({ options, debug: true });
    const data = img.data.replace(/^data:image\/.*;base64,/g, '');
    context.raw = Buffer.from(data, 'base64');

    // 1. grid detection + preprocessing immagine
    await preProcessImage(context);

    // 2. split in 81 celle
    splitImage(context);

    // 3. riconoscimento cifre con cell-reader custom
    return await scanCells(context);
  }
}
