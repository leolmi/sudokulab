import { Injectable } from '@angular/core';
import {SudokulabPage, HelpFacade, SudokuLab} from '@sudokulab/model';
import { AvailablePages } from '../../model';
import { HelpComponent } from './help.component';
import { Routes } from '@angular/router';

@Injectable()
export class HelpManifest extends SudokulabPage {
  code = AvailablePages.help;
  icon = 'help';
  buttons = [];
  title = 'Help';
  executor = undefined;
  getUrl(sl: SudokuLab): string {
    return `${AvailablePages.help}`;
  };
  static routes = (): Routes => [{
    path: `${AvailablePages.help}`,
    component: HelpComponent
  }];
}
