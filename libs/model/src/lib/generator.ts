import { SolveOptions } from './solver';
import { EndGenerationMode, GENERATOR_DEFAULT_NUMBERS, Symmetry, ValorizationMode } from './consts';
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
    this.maxSchemas = o?.maxSchemas||1;
    this.maxSeconds = o?.maxSeconds||0;
    this.symmetry = o?.symmetry||Symmetry.central;
    this.allowTryAlgorithm = !!o?.allowTryAlgorithm;
    this.oneForSchema = _isBoolean(o?.oneForSchema) ? !!o?.oneForSchema : true;
    this.useAlgorithms = o?.useAlgorithms||[];
    this.workersLength = o?.workersLength||2;
  }

  endMode: EndGenerationMode;
  valuesMode: ValorizationMode;
  difficultyLimitMax: string;
  difficultyLimitMin: string;
  allowTryAlgorithm: boolean;
  oneForSchema: boolean;
  fixedCount: number;
  maxSchemas: number;
  maxSeconds: number;
  symmetry: Symmetry;
  useAlgorithms: string[];
  workersLength: number;
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
