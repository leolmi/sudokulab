import {Injectable} from "@angular/core";
import {LabFacade, SudokuFacade, SudokulabPage} from "@sudokulab/model";
import {AvailablePages} from "../../model";

@Injectable()
export class LabManifest extends SudokulabPage {
  default = true;
  code = AvailablePages.lab;
  icon = 'grid_on';
  buttons = [
    {icon: 'support', code: 'stepinfo', tooltip: 'Info next step', disabledKey: 'has_no_lab_schema'},
    {icon: 'skip_next', code: 'step', tooltip: 'Solve next step', disabledKey: 'has_no_lab_schema'},
    {separator: true},
    {icon: 'auto_fix_high', code: 'solve', tooltip: 'Solve all schema', disabledKey: 'has_no_lab_schema'},
    // {icon: 'play_circle_outline', code: 'analyze', tooltip: 'Analyze schema', disabledKey: 'has_no_lab_schema'},
    {separator: true},
    {icon: 'download', code: 'download', tooltip: 'Download current schema', disabledKey: 'has_no_lab_schema'},
    {icon: 'apps_outage', code: 'upload', tooltip: 'Open schema'},
    {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema', disabledKey: 'has_no_lab_schema'}
  ];
  title = 'Player';
  execute = (facade: LabFacade, code: string) => {
    switch (code) {
      case 'step': return facade.solveStep();
      case 'clear': return facade.clear();
      case 'solve': return facade.solve();
      case 'analyze': return facade.analyze();
      case 'download': return facade.download();
      case 'upload': return facade.upload();
      case 'stepinfo': return facade.stepInfo();
    }
  }
}
