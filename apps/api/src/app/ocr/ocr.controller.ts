import { Body, Controller, Post } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { MapDto } from '../../model/map.dto';
import { badRequest } from '../../model/consts';
import { ImgDto } from '../../model/img.dto';
import { OcrResult } from '../../model/ocr.result';

/**
 * GESTIONE DEGLI OCR
 *
 */
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}


  /**
   * ricava i numeri dello schema rappresentato in figura
   * @param img
   */
  @Post('scan')
  async ocr(@Body() img: ImgDto): Promise<OcrResult> {
    if (!img.data) badRequest('undefined image data');
    return await this.ocrService.ocr(img);
  }

  /**
   * aggiorna la mappa di un carattere
   * @param m
   */
  @Post('map')
  async ocrMap(@Body() m: MapDto): Promise<any> {
    if ((m?.map || []).length < 1 || !m.text) badRequest('undefined image data or character');
    return await this.ocrService.ocrMap(m);
  }

  /**
   * test operazione ocr
   */
  @Post('test')
  async ocrTest(): Promise<OcrResult> {
    return await this.ocrService.ocrTest();
  }
}
