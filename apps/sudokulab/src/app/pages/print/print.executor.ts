import {SudokuLab, SudokulabPageExecutor, SudokulabWindowService} from "@sudokulab/model";
import {composePage} from "../../../../../../libs/store/src/lib/effects/print.builder";
import {Injectable} from "@angular/core";

@Injectable()
export class PrintExecutor extends SudokulabPageExecutor {
  name = 'print-executor';
  constructor(private _window: SudokulabWindowService) {
    super();
  }

  execute(logic: SudokuLab, code: string) {

    switch (code) {
      case 'print':
        const pages = logic.state.printPages$.value || [];
        const html = pages.map((p, index) => composePage(p, index >= (pages.length - 1))).join('\n');
        const print_page: any = this._window.nativeWindow.open(`../assets/templates/print.html`);
        if (!!print_page) print_page.data = {html};
        break;
      default:
        return console.warn('Unhandled print action', code);
    }

  }
}
