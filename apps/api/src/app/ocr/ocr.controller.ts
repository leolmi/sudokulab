import { Body, Controller, Post } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { badRequest } from '../../model/consts';
import { ImgDto } from '../../model/img.dto';
import { OcrResult } from '../../model/ocr.result';

/**
 * GESTIONE DEGLI OCR
 */
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  /**
   * ricava i numeri dello schema rappresentato in figura
   */
  @Post('scan')
  async ocr(@Body() img: ImgDto): Promise<OcrResult> {
    if (!img.data) badRequest('undefined image data');
    return await this.ocrService.ocr(img);
  }
}
