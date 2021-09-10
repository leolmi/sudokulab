import {MenuButton} from "./MenuButton";
import {SudokuFacade} from "./SudokuFacade";

export abstract class SudokulabPage {
  default?: boolean;
  abstract title: string;
  abstract code: string;
  abstract icon: string;
  abstract buttons: MenuButton[];
  abstract execute(facade: SudokuFacade, code: string): void;
}
