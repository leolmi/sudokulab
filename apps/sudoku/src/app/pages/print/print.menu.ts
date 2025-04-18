import { MenuItem } from '../../model';
import { PrintPage } from '@olmi/model';
import { TEMPLATES } from '@olmi/templates';

const BUTTON_PRINT_CODE = 'print-launch';
const BUTTON_CLEAR_CODE = 'print-clear';

export const MAIN = <MenuItem[]>[
  {
    code: 'print-sep-1',
    separator: true
  },
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
      icon: tmp.icon||'dashboard',
    })
  }
]

export const NARROW = <MenuItem[]>[
  {
    code: 'print-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
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
      })
    ]
  }



]

export const getStatus = (pages: PrintPage[]): any => {
  return {
    [BUTTON_PRINT_CODE]: (pages.length > 0),
    [BUTTON_CLEAR_CODE]: (pages.length > 0),
  }
}
