import {Injectable} from "@angular/core";
import {GeneratorFacade, SudokuFacade, SudokulabPage} from "@sudokulab/model";
import {AvailablePages} from "../../model";

@Injectable()
export class GeneratorManifest extends SudokulabPage {
  code = AvailablePages.generator;
  icon = 'settings';
  buttons = [
    // {icon: 'play_circle', code: 'run', tooltip: 'Run generator'},
    // {icon: 'stop', code: 'stop', tooltip: 'Stop generator'},
    // {separator: true},
    {icon: 'download', code: 'download', tooltip: 'Download current schema'},
    {icon: 'upload', code: 'upload', tooltip: 'Upload a schema'},
    {separator: true},
    {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema'}
  ];
  title = 'Generator';
  execute = (facade: GeneratorFacade, code: string) => {
    switch (code) {
      case 'run': return facade.run();
      case 'stop': return facade.stop();
      case 'download': return facade.download();
      case 'upload': return facade.upload();
      case 'clear': return facade.clear();
    }
  }
}
