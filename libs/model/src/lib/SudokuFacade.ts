import { Observable } from 'rxjs';
import {Facade} from "./Facade";
import {SudokuMessage} from "./SudokuMessage";
import {SudokulabPage} from "./SudokulabPage";


export abstract class SudokuFacade implements Facade {
  name = 'sudoku';
  abstract selectActiveMessage$: Observable<SudokuMessage|undefined>;
  abstract selectActivePage$: Observable<SudokulabPage|undefined>;

  abstract setActivePage(page: SudokulabPage|undefined): void;
  abstract raiseMessage(message: SudokuMessage): void;
}
