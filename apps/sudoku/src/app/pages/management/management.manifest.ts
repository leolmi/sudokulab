import { SudokuPageManifest } from '../../model';
import { MAIN } from './management.menu';
import { environment } from '../../../environment/environment';

export const MANAGEMENT_PAGE_ROUTE = 'management';

export class ManagementPageManifest extends SudokuPageManifest {
  title = 'Management';
  route = MANAGEMENT_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = [];
  icon = 'build';
  override disabled = !environment.management;
}
