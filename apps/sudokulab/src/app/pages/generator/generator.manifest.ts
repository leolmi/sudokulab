import {Injectable} from "@angular/core";
import {GeneratorFacade, SudokuFacade, SudokulabPage} from "@sudokulab/model";
import {AvailablePages} from "../../model";

@Injectable()
export class GeneratorManifest extends SudokulabPage {
  code = AvailablePages.generator;
  icon = 'settings';
  buttons = [];
  title = 'Generator';
  execute = (facade: GeneratorFacade, code: string) => {

  }
}
