import {Observable} from "rxjs";
import {EditSudoku} from "@sudokulab/model";
import {Facade} from "./Facade";

export abstract class GeneratorFacade implements Facade {
  name = 'generator';
  abstract selectActiveSudoku$: Observable<EditSudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;
}
