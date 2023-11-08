
export interface ButtonInfo {
  separator?: boolean;
  tooltip?: string;
  icon?: string;
  code?: string;
  disabledKey?: string;
  checkedKey?: string;
  invisibleKey?: string;
}


export class MenuButton implements ButtonInfo {
  constructor(b?: Partial<MenuButton>) {
    this.separator = false;
    Object.assign(this, b || {});
  }
  code?: string;
  icon?: string;
  caption?: string;
  separator?: boolean;
  tooltip?: string;
  disabledKey?: string;
  invisibleKey?: string;
  checkedKey?: string;
}
