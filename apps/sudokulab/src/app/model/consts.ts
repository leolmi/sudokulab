export enum AvailablePages {
  lab = 'lab',
  generator = 'generator',
  options = 'options',
  print = 'print',
  help = 'help'
}

export const SOLVER_STEP_DETAILS = 'solver-step-details';

export const DEFAULT_BUTTONS = {
  separator: {separator: true},
}

export const DEFAULT_LAB_BUTTONS = {
  stepinfo: {icon: 'support', code: 'stepinfo', tooltip: 'Info next step', disabledKey: 'has_no_lab_schema'},
  step: {icon: 'skip_next', code: 'step', tooltip: 'Solve next step', disabledKey: 'has_no_lab_schema'},
  solve: {icon: 'auto_fix_high', code: 'solve', tooltip: 'Solve all schema', disabledKey: 'has_no_lab_schema'},
  analyze: {icon: 'play_circle_outline', code: 'analyze', tooltip: 'Analyze schema', disabledKey: 'has_no_lab_schema'},
  download: {icon: 'download', code: 'download', tooltip: 'Download current schema', disabledKey: 'has_no_lab_schema'},
  upload: {icon: 'apps_outage', code: 'upload', tooltip: 'Open schema'},
  camera: {icon: 'camera', code: 'camera', tooltip: 'Acquire by camera', invisibleKey: 'not_available_camera' },
  clear : {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema', disabledKey: 'has_no_lab_schema'},
  available: {icon: 'apps', code: 'available', tooltip: 'Show available numbers', disabledKey: 'has_no_lab_schema', checkedKey: 'available_visible'},
  popupdetails: {icon: 'backup_table', code: 'popupdetails', tooltip: 'Show popup details', disabledKey: 'has_no_lab_schema', checkedKey: 'popup_details'},
}
