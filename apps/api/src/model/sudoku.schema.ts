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
   * numero di algoritmi distinti utilizzati (cardinalità di `difficultyMap`)
   */
  @Prop()
  algorithmCount: number;
  /**
   * vero se la risoluzione richiede l'algoritmo `TryNumber` (brute-force)
   */
  @Prop()
  useTryAlgorithm: boolean;
  /**
   * numero di applicazioni dell'algoritmo `TryNumber` nella sequenza
   */
  @Prop()
  tryAlgorithmCount: number;
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
  /**
   * id canonico dell'orbita di equivalenza (D4 + relabeling cifre):
   * schemi equivalenti sotto rotazione/flip/permutazione cifre condividono
   * lo stesso valore (vedi `canonize` in `@olmi/model`)
   */
  @Prop({ index: true })
  canonicalId: string;
  /**
   * token di trasformazione `t:relabel` che, applicato al canonicalId,
   * ricostruisce `values` (vedi `applyToken` in `@olmi/model`)
   */
  @Prop()
  canonicalToken: string;
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
