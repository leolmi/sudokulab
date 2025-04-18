import { SudokuError } from '@olmi/model';

export interface ErrorCellArgs {
  cid?: string;
}

export class ErrorWrongCellValue implements SudokuError {
  constructor(args: ErrorCellArgs) {
    this.code = 'E001'
    this.message = `Wrong value for the cell "${args.cid||'unknown'}"!`
  }

  code: string;
  message: string;
}


export class ErrorNoValueForCell implements SudokuError {
  constructor(args: ErrorCellArgs) {
    this.code = 'E002'
    this.message = `No possible value for the cell "${args.cid||'unknown'}"!`
  }

  code: string;
  message: string;
}



