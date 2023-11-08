import {SudokuLab, SudokulabPageExecutor} from "@sudokulab/model";
import {Injectable} from "@angular/core";

@Injectable()
export class GeneratorExecutor extends SudokulabPageExecutor {
  name = 'generator-executor';
  execute(logic: SudokuLab, code: string) {
    switch (code) {
      case 'upload':
        logic.upload().subscribe();
        break;
      default:
        logic.emit(`gen.${code}`);
    }
  }
}
