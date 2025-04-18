import { Dictionary, LogicOperation } from '@olmi/model';

export class ToolbarButton {
  code?: string;
  icon?: string;
  text?: string;
  value?: string;
  color?: string;
  operation?: LogicOperation;
}

export class ToolbarStatus {
  constructor() {
    this.active = {};
    this.hidden = {};
    this.disabled = {};
  }

  hidden: any;
  disabled: any;
  active: any;
}

const getStandardNumericButtons = (): ToolbarButton[] => {
  return ['1','2','3','4','5','6','7','8','9'].map(n => <ToolbarButton>{
    text: n,
    code: `tb-value-${n}`,
    value: n
  });
}

// "nums,clear,pencil"
// "nums,clear,play"

export const StandardToolbarButtons = <Dictionary<ToolbarButton[]>>{
  nums: getStandardNumericButtons(),
  clear: [{
    icon: 'check_box_outline_blank',
    code: `tb-value-empty`,
    value: ''
  }, {
    icon: 'help_center',
    code: `tb-value-dynamic`,
    value: '?'
  }],
  pencil: [{
    icon: 'edit',
    code: 'tb-pencil',
    operation: 'toggle',
    value: 'isPencil'
  }],
  play: [{
    icon: 'play_arrow',
    code: 'tb-play',
    operation: 'generate',
    color: 'accent'
  }, {
    icon: 'stop',
    code: 'tb-stop',
    operation: 'stop',
    color: 'secondary'
  }],
  delete: [{
    icon: 'delete',
    code: 'tb-delete',
    operation: 'clear',
  }]
};
