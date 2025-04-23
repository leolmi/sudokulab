import { Dictionary, MenuItemColor } from './types';

export class ButtonsStatus {
  constructor() {
    this.hidden = {};
    this.active = {};
    this.disabled = {};
    this.routeActive = {};
    this.text = {};
    this.color = {};
    this.icon = {};
  }

  hidden: Dictionary<boolean>;
  disabled: Dictionary<boolean>;
  active: Dictionary<boolean>;
  routeActive: Dictionary<string>;
  text: Dictionary<string>;
  color: Dictionary<MenuItemColor>;
  icon: Dictionary<string>;
}
