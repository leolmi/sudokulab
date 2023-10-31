import { MenuButton } from './MenuButton';
import {SudokuLab} from "./logic";

export abstract class SudokulabPageExecutor {
  abstract name: string;
  abstract execute(logic: SudokuLab, code: string): void;
}

export abstract class SudokulabPage {
  default?: boolean;
  abstract title: string;
  abstract code: string;
  abstract icon: string;
  abstract buttons: MenuButton[];
  abstract executor?: string;
  abstract getUrl(sl: SudokuLab): string;
}
