import {Dictionary} from "@ngrx/entity";
import {ButtonInfo} from "@sudokulab/model";

export enum AvailablePages {
  lab = 'lab',
  generator = 'generator',
  options = 'options',
  print = 'print',
  help = 'help'
}

export const SOLVER_STEP_DETAILS = 'solver-step-details';

export type Buttons = {[name: string]: ButtonInfo};

export const DEFAULT_BUTTONS = {
  test: {icon: 'bug_report', code: 'test', tooltip: 'run test', disabledKey: 'has_no_lab_test'},
  upload: {icon: 'apps_outage', code: 'upload', tooltip: 'Open schema'},
  separator: {separator: true},
}

export const DEFAULT_LAB_PAGE_STATUS = {
  has_no_lab_schema: 'has_no_lab_schema',
  has_no_try_schema: 'has_no_try_schema',
  not_available_camera: 'not_available_camera',
  available_visible_checked: 'available_visible_checked',
  popup_details_checked: 'popup_details_checked',
}

export const DEFAULT_LAB_BUTTONS = {
  stepinfo: {icon: 'support', code: 'calcStep', tooltip: 'Info next step', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  step: {icon: 'skip_next', code: 'solveStep', tooltip: 'Solve next step', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  steptotry: {icon: 'fast_forward', code: 'solveToTry', tooltip: 'Solve to try step', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_try_schema},
  solve: {icon: 'auto_fix_high', code: 'solve', tooltip: 'Solve all schema', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  analyze: {icon: 'cloud_sync', code: 'analyze', tooltip: 'Analyze schema', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  download: {icon: 'download', code: 'download', tooltip: 'Download current schema', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  camera: {icon: 'camera', code: 'camera', tooltip: 'Acquire by camera', disabledKey: DEFAULT_LAB_PAGE_STATUS.not_available_camera },
  clear : {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema},
  available: {icon: 'apps', code: 'available', tooltip: 'Show available numbers', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema, checkedKey: DEFAULT_LAB_PAGE_STATUS.available_visible_checked},
  popupdetails: {icon: 'backup_table', code: 'popupdetails', tooltip: 'Show popup details', disabledKey: DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema, checkedKey: DEFAULT_LAB_PAGE_STATUS.popup_details_checked},
}

export const DEFAULT_GENERATOR_PAGE_STATUS = {
  gen_running: 'gen_running',
  gen_not_running: 'gen_not_running',
  has_no_schemas: 'has_no_schemas',
  has_no_gen_schema: 'has_no_gen_schema'
}

export const DEFAULT_GENERATOR_BUTTONS = {
  run: {icon: 'play_circle', code: 'run', tooltip: 'Run generator', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.gen_running},
  stop: {icon: 'stop', code: 'stop', tooltip: 'Stop generator', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.gen_not_running},
  generate: {icon: 'auto_fix_high', code: 'generate', tooltip: 'Generate schema'},
  downloadAll: {icon: 'sim_card_download', code: 'downloadAll', tooltip: 'Download all generated schema', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.has_no_schemas},
  removeAll: { icon: 'delete', code: 'removeAll', tooltip: 'Remove all generated schemas', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.has_no_schemas },
  download: { icon: 'download', code: 'download', tooltip: 'Download current schema', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.has_no_gen_schema },
  clear : {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema', disabledKey: DEFAULT_GENERATOR_PAGE_STATUS.has_no_gen_schema},
}

export const DEFAULT_PRINT_PAGE_STATUS = {
  has_no_page: 'has_no_page'
}

export const DEFAULT_PRINT_BUTTONS = {
  print: {icon: 'print', code: 'print', tooltip: 'Print', disabledKey: DEFAULT_PRINT_PAGE_STATUS.has_no_page }
}
