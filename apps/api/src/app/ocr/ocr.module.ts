import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { ocrProviders } from '../../model/ocr.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [OcrController],
  providers: [
    OcrService,
    ...ocrProviders],
})
export class OcrModule {}
