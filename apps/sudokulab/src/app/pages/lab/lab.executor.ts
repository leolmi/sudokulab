import {SudokuLab, SudokulabPageExecutor} from "@sudokulab/model";
import {Injectable} from "@angular/core";

@Injectable()
export class LabExecutor extends SudokulabPageExecutor {
  name = 'lab-executor';
  execute(logic: SudokuLab, code: string): void {
    switch (code) {
      // case 'test': return facade.action$.next(BoardAction.test);
      case 'upload':
        logic.upload().subscribe();
        break;
      case 'camera':
        logic.camera().subscribe();
        break;
      // case 'popupdetails': return facade.action$.next(BoardAction.details);
      default:
        logic.emit(`lab.${code}`);
    }
  }
}
