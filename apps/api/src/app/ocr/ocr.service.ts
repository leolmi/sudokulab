import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs';
import { OCR_MAP_SIZE, OcrContext, OcrMap } from '../../model/ocr.model';
import { MapDto } from '../../model/map.dto';
import { OcrResult } from '../../model/ocr.result';
import { preProcessImage, scanCells, splitImage } from './ocr.helper';
import { Model } from 'mongoose';
import { SudokuOcrMapDoc } from '../../model/ocr-map.interface';


@Injectable()
export class OcrService implements OnModuleInit {

  constructor(@Inject('SUDOKU_OCR_MODEL') private readonly ocrModel: Model<SudokuOcrMapDoc>) {}

  async onModuleInit() {}

  async ocr(img: ImgDto, options?: OcrOptions): Promise<OcrResult> {
    const maps = await this.ocrModel.find().exec();
    // console.log(`${maps.length} stored maps found`);
    const context = new OcrContext({ options });
    const data = img.data.replace(/^data:image\/.*;base64,/g, '');
    context.raw = Buffer.from(data, 'base64');

    // console.log('CONTEXT RAW TYPE', typeof context.raw);

    // 1. modifica l'immagine
    await preProcessImage(context, img.crop);

    // 2. frazionamento (81 celle)
    splitImage(context);

    // 3. ocr su ogni cella valorizzata
    return await scanCells(context, maps||[]);
  }

  async ocrTest(): Promise<OcrResult> {
    const imgPath = './dist/source/test.jpg';
    // Read data
    const bitmap = fs.readFileSync(imgPath);
    // convert binary data to base64 encoded string
    const data = Buffer.from(bitmap).toString('base64');
    return await this.ocr({ data });
  }

  /**
   * aggiunge la mappa a quelle utilizzate dall'interprete
   * @param om
   */
  async ocrMap(om: MapDto): Promise<any> {
    if (!om.text || !om.map) {
      // console.log('INVALID MAP', om);
      return null;
    }
    const exs = await this.ocrModel.find({ map: om.map }).exec();
    if (exs.length > 0) {
      // console.log('MAP ALREADY EXISTS');
      return null;
    }
    const map = <OcrMap>{
      map: om.map,
      text: om.text,
      size: OCR_MAP_SIZE
    }
    // console.log('CREATING MAP', map);
    return await this.ocrModel.create(map);
  }

  async clearMaps(): Promise<any> {
    const res = await this.ocrModel.deleteMany({}).exec();
    const maps = await this.ocrModel.find().exec();
    console.log(`${maps.length} stored maps found`);
    return res;
  }
}
