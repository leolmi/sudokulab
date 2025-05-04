import { ApplySudokuRulesOptions } from './options';

export interface SudokuError {
  // constructor(e?: Partial<SudokuError>) {
  //   Object.assign(<any>this, e || {});
  //
  //   this.code = e?.code||'';
  //   this.message = e?.message||'generic error';
  // }

  code: string;
  message: string;
}

export type ErrorsContainer = {[code: string]: SudokuError};

export interface CheckErrorsOptions extends ApplySudokuRulesOptions {

}
