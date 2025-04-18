import { LogicOperation } from '@olmi/model';

export class MenuItem {
  constructor(i?: Partial<MenuItem>) {
    Object.assign(<any>this, i || {});
  }
  separator?: boolean;
  code?: string;
  icon?: string;
  text?: string;
  isDynamicText?: boolean;
  logic?: 'toggle'|'switch'|'navigate'|'execute'|'private';
  property?: string;
  owner?: string;
  color?: 'error'|'warning'|'success'|'accent'|'secondary';
  operation?: LogicOperation;
  subMenu?: MenuItem[];
}
