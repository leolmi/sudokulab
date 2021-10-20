import { MenuButton } from './MenuButton';
import { Facade } from './Facade';

export abstract class SudokulabPage {
  default?: boolean;
  abstract title: string;
  abstract code: string;
  abstract icon: string;
  abstract buttons: MenuButton[];
  abstract execute(facade: Facade, code: string): void;
}
