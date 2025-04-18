import { SudokuPageManifest } from '../../model';

export const INFOS_PAGE_ROUTE = 'infos';

export class InfosPageManifest extends SudokuPageManifest {
  title = 'Infos';
  route = INFOS_PAGE_ROUTE;
  menu = [];
  narrowMenu = [];
  icon = 'help';
}
