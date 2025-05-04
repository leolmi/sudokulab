import { ValueOptions } from './value-options';


export interface ApplySudokuRulesOptions extends ValueOptions {
  /**
   * resetta lo stato degli available prima di procedere (default=false)
   */
  resetBefore?: boolean;
}

/**
 * opzioni per la verifica dello schema
 */
export interface CheckAvailableOptions extends ApplySudokuRulesOptions {
  /**
   * considera fissi tutti i valori presenti (default=false)
   */
  valueAsFixed?: boolean;
}
