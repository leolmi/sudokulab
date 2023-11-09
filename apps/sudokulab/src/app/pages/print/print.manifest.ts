import {Injectable} from '@angular/core';
import {SudokuLab, SudokulabPage} from '@sudokulab/model';
import {AvailablePages, DEFAULT_PRINT_BUTTONS} from '../../model';
import {PrintComponent} from './print.component';
import {Routes} from '@angular/router';

@Injectable()
export class PrintManifest extends SudokulabPage {
  code = AvailablePages.print;
  icon = 'print';
  buttons = [
    DEFAULT_PRINT_BUTTONS.print
  ];
  title = 'Print';
  executor = 'print-executor';
  getUrl(sl: SudokuLab): string {
    return `${AvailablePages.print}`;
  };
  static routes = (): Routes => [{
    path: `${AvailablePages.print}`,
    component: PrintComponent
  }];
}
