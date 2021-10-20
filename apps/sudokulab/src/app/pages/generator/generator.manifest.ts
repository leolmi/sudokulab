import { Injectable } from '@angular/core';
import { GeneratorFacade, SudokulabPage } from '@sudokulab/model';
import { AvailablePages } from '../../model';
import { GeneratorComponent } from './generator.component';
import { Routes } from '@angular/router';

@Injectable()
export class GeneratorManifest extends SudokulabPage {
  code = AvailablePages.generator;
  icon = 'settings';
  buttons = [
    // {icon: 'play_circle', code: 'run', tooltip: 'Run generator'},
    // {icon: 'stop', code: 'stop', tooltip: 'Stop generator'},
    {icon: 'auto_fix_high', code: 'generate', tooltip: 'Generate schema'},
    {separator: true},
    {
      icon: 'sim_card_download',
      code: 'downloadAll',
      tooltip: 'Download all generated schema',
      disabledKey: 'has_no_schemas'
    },
    { icon: 'delete', code: 'removeAll', tooltip: 'Remove all generated schemas', disabledKey: 'has_no_schemas' },
    { separator: true },
    { icon: 'download', code: 'download', tooltip: 'Download current schema' },
    { icon: 'apps_outage', code: 'upload', tooltip: 'Open schema' },
    { icon: 'border_clear', code: 'clear', tooltip: 'Clear schema' }
  ];
  title = 'Generator';
  execute = (facade: GeneratorFacade, code: string) => {
    switch (code) {
      case 'run':
        return facade.run();
      case 'stop':
        return facade.stop();
      case 'download':
        return facade.download();
      case 'downloadAll':
        return facade.downloadAll();
      case 'upload':
        return facade.upload();
      case 'clear':
        return facade.clear();
      case 'removeAll':
        return facade.removeAll();
      case 'generate':
        return facade.generate();
    }
  };
  static routes = (): Routes => [{
    path: `${AvailablePages.generator}`,
    component: GeneratorComponent
  }];
}
