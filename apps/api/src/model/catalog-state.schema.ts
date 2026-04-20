import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


/**
 * Documento singoletto che tiene traccia dell'esito dell'ultimo `checkAll`
 * completato con successo. Serve a saltare il check all'avvio se il catalogo
 * è già certificato per la `algorithmsVersion` corrente.
 *
 * Strategia di invalidazione:
 *  - `lastCheckVersion !== algorithmsVersion` → bump di versione, re-check obbligatorio
 *  - `lastSchemaCount !== current count` → qualcuno ha modificato il catalogo
 *    bypassando le API (edit diretto su Mongo): re-check per sicurezza
 *  - endpoint `POST /sudoku/invalidate-check` → invalidazione manuale esplicita
 */
@Schema({ collection: 'catalog_state' })
export class CatalogStateDoc extends Document {
  @Prop()
  override _id: string;

  /**
   * algorithmsVersion dell'ultimo checkAll completato
   */
  @Prop()
  lastCheckVersion: string;

  /**
   * timestamp (ms) del completamento dell'ultimo checkAll
   */
  @Prop()
  lastCheckAt: number;

  /**
   * numero di schemi presenti nel catalogo al termine dell'ultimo checkAll
   */
  @Prop()
  lastSchemaCount: number;

  /**
   * statistiche sintetiche dell'ultimo checkAll
   */
  @Prop({ type: Object })
  lastCheckStats: {
    tot: number;
    updated: number;
    skipped: number;
    failed: number;
    deleted: number;
    elapsedMs: number;
  };
}

export const CATALOG_STATE_SINGLETON_ID = 'singleton';
export const CatalogStateSchema = SchemaFactory.createForClass(CatalogStateDoc);
