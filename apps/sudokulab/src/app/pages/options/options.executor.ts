import {SudokuLab, SudokulabPageExecutor} from "@sudokulab/model";
import {Injectable} from "@angular/core";

@Injectable()
export class OptionsExecutor extends SudokulabPageExecutor {
  name = 'options-executor';
  execute(logic: SudokuLab, code: string) {

    switch (code) {
      // case 'reset': return facade.reset();
      default:
        return console.warn('Unhandled options action', code);
    }
  }
}
