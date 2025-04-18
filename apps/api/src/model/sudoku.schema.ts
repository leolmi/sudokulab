import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema()
class Info extends Document {
  /**
   * dimensione schema
   */
  @Prop()
  rank: number;
  /**
   * numero di valori fissi
   */
  @Prop()
  fixedCount: number;
  /**
   * simmetria dei valori
   */
  @Prop()
  symmetry: string;
  /**
   * schema a soluzione unica
   */
  @Prop()
  unique: boolean;
  /**
   * difficolta di base (easy/medium/hard)
   */
  @Prop()
  difficulty: string;
  /**
   * valore della difficoltà
   */
  @Prop()
  difficultyValue: number;
  /**
   * mappa dell'utilizzo degli algoritmi di risoluzione
   */
  @Prop({ type: Object })
  difficultyMap: any;
  /**
   * versione dello schema sudoku
   */
  @Prop()
  version: string;
  /**
   * origine dello schema sudoku
   */
  @Prop()
  origin: string;
}

@Schema()
class Sudoku extends Document {
  /**
   * fixed values string for id
   */
  @Prop()
  _id: string;
  /**
   * nome
   */
  @Prop()
  name: string;
  /**
   * fixed values string
   */
  @Prop()
  values: string;
  /**
   * informazioni sullo schema
   */
  @Prop()
  info: Info;
}

export const SudokuSchema = SchemaFactory.createForClass(Sudoku);
