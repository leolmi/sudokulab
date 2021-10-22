import { Facade, PrintData, PrintPage, SudokuMessage } from '@sudokulab/model';
import { Observable } from 'rxjs';

export abstract class PrintFacade implements Facade {
  name = 'print';
  abstract selectPrintPages$: Observable<PrintPage[]>;
  abstract selectActivePageArea$: Observable<string>;

  abstract raiseMessage(message: SudokuMessage): void;
  abstract setPrintPages(pages: PrintPage[]): void;
  abstract setPrintArea(area: string): void;
  abstract print(): void;
}
