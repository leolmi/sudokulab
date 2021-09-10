import {Injectable} from "@angular/core";
import {SudokuFacade, SudokulabPage} from "@sudokulab/model";
import {AvailablePages} from "../../model";

@Injectable()
export class OptionsManifest extends SudokulabPage {
  code = AvailablePages.options;
  icon = 'rule';
  buttons = [];
  title = 'Options';
  execute = (facade: SudokuFacade, code: string) => {

  }
}
