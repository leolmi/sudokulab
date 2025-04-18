import { MenuItem } from '@olmi/common';

const GENERATOR_MENU = <MenuItem[]>[
  {
    code: 'generator-generate',
    property: 'generate',
    operation: 'generate',
    logic: 'execute',
    // icon: 'auto_fix_high',
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
  {
    code: 'generator-skip',
    logic: 'execute',
    property: 'skip',
    operation: 'skip',
    icon: 'redo',
    text: 'Skip schema',
  },
  {
    code: 'generator-sep-2',
    separator: true
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
    code: 'generator-clear',
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
]

export const MAIN = <MenuItem[]>[
  {
    code: 'generator-sep-1',
    separator: true
  },
  ...GENERATOR_MENU
];

export const NARROW = <MenuItem[]>[
  {
    code: 'generator-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      ...GENERATOR_MENU
    ]
  }
];
