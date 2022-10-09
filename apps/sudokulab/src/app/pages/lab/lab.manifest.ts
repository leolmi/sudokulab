import { Injectable } from '@angular/core';
import { LabFacade, SudokulabPage } from '@sudokulab/model';
import { AvailablePages } from '../../model';
import { LabComponent } from './lab.component';
import { Routes } from '@angular/router';

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
    {icon: 'camera', code: 'camera', tooltip: 'Acquire by camera', invisibleKey: 'not_available_camera' },
    {icon: 'border_clear', code: 'clear', tooltip: 'Clear schema', disabledKey: 'has_no_lab_schema'},
    {separator: true},
    {icon: 'apps', code: 'available', tooltip: 'Show available numbers', disabledKey: 'has_no_lab_schema', checkedKey: 'available_visible'},
    {icon: 'backup_table', code: 'popupdetails', tooltip: 'Show popup details', disabledKey: 'has_no_lab_schema', checkedKey: 'popup_details'},
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
      case 'camera': return facade.camera();
      case 'available': return facade.toggleAvailable();
      case 'popupdetails': return facade.togglePopupDetails();
    }
  }
  static routes = (): Routes => [{
    path: '',
    component: LabComponent
  }, {
    path: `${AvailablePages.lab}`,
    component: LabComponent
  }, {
    path: `${AvailablePages.lab}/:id`,
    component: LabComponent
  }];
}
