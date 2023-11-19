import {PlaySudokuOptions} from "./PlaySudokuOptions";

export class UserData {
  constructor(ud?: Partial<UserData>) {
    Object.assign(this, ud || {});
    this.options = new PlaySudokuOptions(ud?.options);
  }
  options?: PlaySudokuOptions;
}
