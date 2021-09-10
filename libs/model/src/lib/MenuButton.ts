export class MenuButton {
  constructor(b?: Partial<MenuButton>) {
    this.separator = false;
    Object.assign(this, b || {});
  }
  code?: string;
  icon?: string;
  caption?: string;
  separator?: boolean;
  tooltip?: string;
}
