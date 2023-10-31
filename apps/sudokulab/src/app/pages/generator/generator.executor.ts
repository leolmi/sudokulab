import {SudokuLab, SudokulabPageExecutor} from "@sudokulab/model";
import {Injectable} from "@angular/core";

@Injectable()
export class GeneratorExecutor extends SudokulabPageExecutor {
  name = 'generator-executor';
  execute(logic: SudokuLab, code: string) {

    switch (code) {
      // case 'run': return facade.action$.next(GeneratorAction.run);
      // case 'stop': return facade.action$.next(GeneratorAction.stop);
      // case 'download': return facade.action$.next(GeneratorAction.download);
      // case 'downloadAll': return facade.action$.next(GeneratorAction.downloadAll);
      // case 'upload': return facade.action$.next(GeneratorAction.upload);
      // case 'clear': return facade.action$.next(GeneratorAction.clear);
      // case 'removeAll': return facade.action$.next(GeneratorAction.removeAll);
      // case 'generate': return facade.action$.next(GeneratorAction.generate);
      default: return console.warn('Unhandled generator action', code);
    }

  }
}
