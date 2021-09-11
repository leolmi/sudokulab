import {Observable} from "rxjs";
import {PlaySudoku} from "@sudokulab/model";
import {Facade} from "./Facade";

export abstract class GeneratorFacade implements Facade {
  name = 'generator';
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;
}
