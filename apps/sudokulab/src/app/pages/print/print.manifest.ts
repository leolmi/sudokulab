import {Injectable} from '@angular/core';
import {SudokuLab, SudokulabPage} from '@sudokulab/model';
import {AvailablePages} from '../../model';
import {PrintComponent} from './print.component';
import {Routes} from '@angular/router';
import {PrintExecutor} from "./print.executor";

@Injectable()
export class PrintManifest extends SudokulabPage {
  code = AvailablePages.print;
  icon = 'print';
  buttons = [
    {icon: 'print', code: 'print', tooltip: 'Print'}
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
