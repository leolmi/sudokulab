import { MenuItem, SYSTEM_MENU_ITEMS } from '@olmi/model';

const GENERATOR_MENU = <MenuItem[]>[
  {
    code: 'generator-generate',
    property: 'generate',
    operation: 'generate',
    logic: 'execute',
    color: 'accent',
    icon: 'play_arrow',
    text: 'Start generation',
  },
  {
    code: 'generator-stop',
    logic: 'execute',
    property: 'stop',
    operation: 'stop',
    icon: 'stop',
    color: 'error',
    text: 'Stop generation',
  },
]

export const MAIN = <MenuItem[]>[
  ...GENERATOR_MENU,
  {
    code: 'generator-skip',
    logic: 'execute',
    property: 'skip',
    operation: 'skip',
    icon: 'redo',
    text: 'Skip schema',
  },
  {
    separator: true
  },
  {
    code: 'generator-clear',
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
  {
    code: 'generator-build',
    logic: 'execute',
    property: 'build',
    operation: 'build',
    icon: 'auto_fix_high',
    text: 'Generate a schema'
  },
  {
    separator: true
  },
  SYSTEM_MENU_ITEMS.lightTheme,
  SYSTEM_MENU_ITEMS.darkTheme,
  SYSTEM_MENU_ITEMS.restoreSettings,
];

export const NARROW = <MenuItem[]>[
  {
    code: 'generator-clear',
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
  {
    code: 'generator-build',
    logic: 'execute',
    property: 'build',
    operation: 'build',
    icon: 'auto_fix_high',
    text: 'Generate a schema'
  },
  {
    code: 'generator-skip',
    logic: 'execute',
    property: 'skip',
    operation: 'skip',
    icon: 'redo',
    text: 'Skip schema',
  },
  {
    code: 'generator-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      ...GENERATOR_MENU,
      {
        separator: true
      },
      SYSTEM_MENU_ITEMS.lightTheme,
      SYSTEM_MENU_ITEMS.darkTheme,
      SYSTEM_MENU_ITEMS.restoreSettings,
    ]
  }
];
