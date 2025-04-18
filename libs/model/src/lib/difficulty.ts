import { Dictionary } from './types';
import { TRY_NUMBER_ALGORITHM } from './consts';
import { keys as _keys } from 'lodash';

export class Difficulty {
  constructor(d?: Partial<Difficulty>) {
    Object.assign(<any>this, d || {});

    this.difficulty = d?.difficulty || '';
    this.difficultyValue = d?.difficultyValue || 0;
    this.difficultyMap = d?.difficultyMap || {};

    // calculated
    this.algorithmCount = _keys(this.difficultyMap).length;
    this.tryAlgorithmCount = ((d?.difficultyMap||{})[TRY_NUMBER_ALGORITHM]||[]).length;
    this.useTryAlgorithm = this.tryAlgorithmCount>0;
  }

  /**
   * descrizione della difficoltù
   */
  difficulty: string;
  /**
   * valore della difficoltà
   */
  difficultyValue: number;
  /**
   * mappa degli algoritmi utilizzati
   */
  difficultyMap: Dictionary<number[]>;


  /**
   * vero se utilizza l'algoritmo brutal-force
   */
  useTryAlgorithm: boolean;
  /**
   * numero di algoritmi utilizzato
   */
  algorithmCount: number;
  /**
   * numero di utilizzi dell'algoritmo brutal-force
   */
  tryAlgorithmCount: number;
}
