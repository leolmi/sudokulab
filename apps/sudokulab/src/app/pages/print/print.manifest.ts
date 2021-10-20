import { Injectable } from '@angular/core';
import { PrintFacade, SudokulabPage } from '@sudokulab/model';
import { AvailablePages } from '../../model';
import { PrintComponent } from './print.component';
import { Routes } from '@angular/router';

@Injectable()
export class PrintManifest extends SudokulabPage {
  code = AvailablePages.print;
  icon = 'print';
  buttons = [
    {icon: 'print', code: 'print', tooltip: 'Print'}
  ];
  title = 'Print';
  execute = (facade: PrintFacade, code: string) => {
    switch (code) {
      case 'print': facade.print();
    }
  };
  static routes = (): Routes => [{
    path: `${AvailablePages.print}`,
    component: PrintComponent
  }];
}
