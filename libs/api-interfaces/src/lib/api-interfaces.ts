import {SudokuInfo} from "@sudokulab/model";

export interface Message {
  message: string;
}

export interface Schema {
  _id: number;
  fixed: string;
  info?: SudokuInfo;
  name?: string;
}
