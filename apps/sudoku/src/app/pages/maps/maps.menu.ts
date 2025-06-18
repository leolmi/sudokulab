import { MenuItem, SYSTEM_MENU_ITEMS } from '@olmi/model';


export const MAPS_MENU_CODES: any = {
  clear: 'maps-clear',
  left: 'maps-left',
  right: 'maps-right',
  copy: 'maps-copy'
}

export const MAIN = <MenuItem[]>[
  {
    text: 'Move left',
    code: MAPS_MENU_CODES.left,
    icon: 'chevron_left',
    logic: 'private'
  }, {
    text: 'Move right',
    code: MAPS_MENU_CODES.right,
    icon: 'chevron_right',
    logic: 'private'
  }, {
    separator: true
  }, {
    text: 'Clear grid',
    code: MAPS_MENU_CODES.clear,
    icon: 'border_clear',
    logic: 'private'
  }, {
    separator: true
  }, {
    text: 'Copy map',
    code: MAPS_MENU_CODES.copy,
    icon: 'save_alt',
    logic: 'private'
  }, {
    separator: true
  },
  SYSTEM_MENU_ITEMS.lightTheme,
  SYSTEM_MENU_ITEMS.darkTheme,
]

export const NARROW = <MenuItem[]>[]

