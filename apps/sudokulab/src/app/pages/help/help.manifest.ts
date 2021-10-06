import { Injectable } from '@angular/core';
import { SudokulabPage, HelpFacade } from '@sudokulab/model';
import { AvailablePages } from '../../model';

@Injectable()
export class HelpManifest extends SudokulabPage {
  code = AvailablePages.help;
  icon = 'help';
  buttons = [];
  title = 'Help';
  execute = (facade: HelpFacade, code: string) => {}
}
