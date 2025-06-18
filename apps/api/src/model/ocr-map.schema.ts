import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema()
class SudokuOcrMap extends Document {
  /**
   * dimensione
   */
  @Prop()
  size: number;
  /**
   * testo
   */
  @Prop()
  text: string;
  /**
   * map string values
   */
  @Prop()
  map: string;
}

export const SudokuOcrMapSchema = SchemaFactory.createForClass(SudokuOcrMap);
