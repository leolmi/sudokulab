import {SudokuInfo} from "@sudokulab/model";

export interface Message {
  message: string;
}

export interface Schema {
  fixed: string;
  info?: SudokuInfo;
  name?: string;
}
