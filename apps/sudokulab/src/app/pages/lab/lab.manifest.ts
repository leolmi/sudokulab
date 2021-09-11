import {Injectable} from "@angular/core";
import {LabFacade, SudokuFacade, SudokulabPage} from "@sudokulab/model";
import {AvailablePages} from "../../model";

@Injectable()
export class LabManifest extends SudokulabPage {
  default = true;
  code = AvailablePages.lab;
  icon = 'grid_on';
  buttons = [
    {icon: 'skip_next', code: 'step', tooltip: 'Solve next step'},
    {icon: 'play_circle', code: 'solve', tooltip: 'Solve all schema'},
    {icon: 'play_circle_outline', code: 'analyze', tooltip: 'Analyze schema'},
    {separator: true},
    {icon: 'download', code: 'download', tooltip: 'Download current schema'},
    {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema'}
  ];
  title = 'Lab';
  execute = (facade: LabFacade, code: string) => {
    switch (code) {
      case 'step': return facade.solveStep();
      case 'clear': return facade.clear();
      case 'solve': return facade.solve();
      case 'analyze': return facade.analyze();
      case 'download': return facade.download();
    }
  }
}
