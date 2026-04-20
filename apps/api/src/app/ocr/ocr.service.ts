import { ImgDto } from '../../model/img.dto';
import { OcrOptions } from '../../model/ocr.options';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OcrContext } from '../../model/ocr.model';
import { OcrResult } from '../../model/ocr.result';
import { preProcessImage, scanCells, splitImage } from './ocr.helper';
import { Semaphore, SemaphoreTimeoutError } from './semaphore';


const DEFAULT_CONCURRENCY = 2;
const DEFAULT_QUEUE_TIMEOUT_MS = 25_000;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly sem = new Semaphore(
    Number(process.env.SUDOKULAB_OCR_CONCURRENCY) || DEFAULT_CONCURRENCY
  );
  private readonly queueTimeoutMs =
    Number(process.env.SUDOKULAB_OCR_QUEUE_TIMEOUT_MS) || DEFAULT_QUEUE_TIMEOUT_MS;

  async ocr(img: ImgDto, options?: OcrOptions): Promise<OcrResult> {
    // attesa di uno slot tra i `concurrency` disponibili, con timeout di coda
    try {
      await this.sem.acquire(this.queueTimeoutMs);
    } catch (err) {
      if (err instanceof SemaphoreTimeoutError) {
        const retryAfter = Math.ceil(this.queueTimeoutMs / 1000);
        this.logger.warn(
          `[ocr] queue timeout after ${this.queueTimeoutMs}ms (queueLength=${this.sem.queueLength}, inUse=${this.sem.inUse}/${this.sem.capacity})`
        );
        throw new HttpException(
          {
            code: 'ocr-queue-timeout',
            message: `Il server è al massimo della capacità OCR (${this.sem.capacity} scansioni contemporanee, coda satura). Riprovare tra ${retryAfter}s.`,
            retryAfter,
            queueLength: this.sem.queueLength,
            inUse: this.sem.inUse,
            capacity: this.sem.capacity,
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
      throw err;
    }

    if (this.sem.queueLength > 0) {
      this.logger.log(
        `[ocr] slot acquired (inUse=${this.sem.inUse}/${this.sem.capacity}, queued=${this.sem.queueLength})`
      );
    }

    try {
      const context = new OcrContext({
        options,
        debug: !!process.env.SUDOKULAB_DEBUG,
      });
      const data = img.data.replace(/^data:image\/.*;base64,/g, '');
      context.raw = Buffer.from(data, 'base64');

      // 1. grid detection + preprocessing immagine
      await preProcessImage(context);

      // 2. split in 81 celle
      splitImage(context);

      // 3. riconoscimento cifre con cell-reader custom
      return await scanCells(context);
    } finally {
      this.sem.release();
    }
  }
}
