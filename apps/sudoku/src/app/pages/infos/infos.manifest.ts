import { SudokuPageManifest } from '@olmi/common';
import { MAIN } from './infos.menu';

export const INFOS_PAGE_ROUTE = 'infos';

export class InfosPageManifest extends SudokuPageManifest {
  title = 'Infos';
  route = INFOS_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = MAIN;
  icon = 'help';
}
