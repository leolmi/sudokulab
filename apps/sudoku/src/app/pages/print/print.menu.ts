import { ButtonsStatus, Dictionary, MenuItem, PrintPage, SYSTEM_MENU_ITEMS } from '@olmi/model';
import { TEMPLATES } from '@olmi/templates';
import { reduce as _reduce } from 'lodash';


const BUTTON_PRINT_CODE = 'print-launch';
const BUTTON_CLEAR_CODE = 'print-clear';

export const MAIN = <MenuItem[]>[
  {
    code: BUTTON_PRINT_CODE,
    property: 'print',
    icon: 'print',
    text: 'Print document',
    logic: 'private'
  },
  {
    code: 'print-clear',
    property: 'clear',
    icon: 'delete',
    text: 'Clear document',
    logic: 'private'
  },
  {
    code: 'print-templates',
    icon: 'dashboard',
    text: 'Available templates',
    subMenu: TEMPLATES.map((tmp, index) => <MenuItem>{
      code: `template_${tmp.name}`,
      logic: 'navigate',
      owner: 'template',
      text: tmp.name,
      property: tmp.name,
      icon: tmp.icon || 'dashboard',
    }),
  },
  {
    separator: true
  },
  SYSTEM_MENU_ITEMS.lightTheme,
  SYSTEM_MENU_ITEMS.darkTheme,
  SYSTEM_MENU_ITEMS.restoreSettings,
]

export const NARROW = <MenuItem[]>[
  {
    code: BUTTON_PRINT_CODE,
    property: 'print',
    icon: 'print',
    text: 'Print document',
    logic: 'private'
  },
  {
    code: 'print-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      {
        code: 'print-clear',
        property: 'clear',
        icon: 'delete',
        text: 'Clear document',
        logic: 'private'
      },
      {
        code: 'print-sep-n-1',
        separator: true
      },
      ...TEMPLATES.map((tmp, index) => <MenuItem>{
        code: `template_${tmp.name}`,
        logic: 'navigate',
        owner: 'template',
        text: tmp.name,
        property: tmp.name,
        icon: tmp.icon||'dashboard',
      }),
      {
        separator: true
      },
      SYSTEM_MENU_ITEMS.lightTheme,
      SYSTEM_MENU_ITEMS.darkTheme,
      SYSTEM_MENU_ITEMS.restoreSettings,
    ]
  }
]


export const calcStatusForMenu = (pages: PrintPage[], template: string): Partial<ButtonsStatus> => {
  const tmp_active = _reduce(TEMPLATES, (d, t) =>
    ({ ...d, [`template_${t.name}`]: (t.name===template) }), <Dictionary<boolean>>{});
  return {
    disabled: {
      [BUTTON_PRINT_CODE]: (pages.length < 1),
      [BUTTON_CLEAR_CODE]: (pages.length < 1),
    },
    active: {
      ...tmp_active
    }
  }
}
