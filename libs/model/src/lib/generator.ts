import { SolveOptions } from './solver';
import {
  EndGenerationMode,
  GENERATOR_DEFAULT_NUMBERS,
  GENERATOR_MAX_VARIANTS,
  GENERATOR_MIN_VARIANTS,
  Symmetry,
  ValorizationMode
} from './consts';
import { SudokuEx } from './sudoku';
import { isBoolean as _isBoolean } from 'lodash';


/**
 * Opzioni per il generatore
 */
export class GeneratorOptions extends SolveOptions {
  constructor(o?: Partial<GeneratorOptions>) {
    super(o);

    this.endMode = o?.endMode||EndGenerationMode.afterN;
    this.valuesMode = o?.valuesMode||ValorizationMode.auto;
    this.difficultyLimitMax = o?.difficultyLimitMax||'';
    this.difficultyLimitMin = o?.difficultyLimitMin||'';
    this.fixedCount = o?.fixedCount||GENERATOR_DEFAULT_NUMBERS;
    this.maxOrbits = o?.maxOrbits||1;
    this.maxSeconds = o?.maxSeconds||0;
    this.symmetry = o?.symmetry||Symmetry.central;
    this.allowTryAlgorithm = !!o?.allowTryAlgorithm;
    this.oneForSchema = _isBoolean(o?.oneForSchema) ? !!o?.oneForSchema : true;
    this.useAlgorithms = o?.useAlgorithms||[];
    this.workersLength = o?.workersLength||2;
    // clamp difensivo: l'input UI ha già min/max, ma proteggiamo anche da
    // valori spuri provenienti da config esterne o serializzazioni vecchie
    const v = o?.variantsCount||1;
    this.variantsCount = Math.max(GENERATOR_MIN_VARIANTS, Math.min(GENERATOR_MAX_VARIANTS, v));
  }

  endMode: EndGenerationMode;
  valuesMode: ValorizationMode;
  difficultyLimitMax: string;
  difficultyLimitMin: string;
  allowTryAlgorithm: boolean;
  oneForSchema: boolean;
  fixedCount: number;
  /**
   * In modalità `EndGenerationMode.afterN` indica il numero di **orbite**
   * (famiglie di equivalenza) da generare. Ogni orbita produce
   * `1 + (variantsCount-1)` schemi emessi (originale + varianti).
   * Numero totale di schemi emessi = `maxOrbits × variantsCount`.
   */
  maxOrbits: number;
  maxSeconds: number;
  symmetry: Symmetry;
  useAlgorithms: string[];
  workersLength: number;
  /**
   * Numero di varianti equivalenti da emettere per ogni schema unico generato.
   * Le varianti condividono lo stesso `canonicalId` (orbita di equivalenza
   * sotto D4 + relabeling cifre) ma differiscono per layout e valori delle cifre.
   * Sono scelte con farthest-first sulla Hamming distance per massimizzare la
   * "lontananza visiva" tra di loro.
   *
   * NOTA: con `symmetry` diversa da `central`/`none` le varianti potrebbero
   * cadere su altre simmetrie del gruppo D4 (es. `vertical` può diventare
   * `horizontal` sotto rotazione).
   *
   * Default: 1 (= solo lo schema originale, comportamento legacy).
   */
  variantsCount: number;
}


export class GenerationStat {
  constructor(s?: Partial<GenerationStat>) {
    Object.assign(<any>this, s||{});
  }

  generatedSchema?: SudokuEx;
  generatedSchemaCount?: number;
  managedSchemaCount?: number;
  currentSchema?: string;
}
