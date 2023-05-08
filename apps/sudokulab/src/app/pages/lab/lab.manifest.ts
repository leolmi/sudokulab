import { Injectable } from '@angular/core';
import { LabFacade, SudokulabPage } from '@sudokulab/model';
import {AvailablePages, DEFAULT_BUTTONS, DEFAULT_LAB_BUTTONS} from '../../model';
import { LabComponent } from './lab.component';
import { Routes } from '@angular/router';

@Injectable()
export class LabManifest extends SudokulabPage {
  default = true;
  code = AvailablePages.lab;
  icon = 'grid_on';
  buttons = [
    // DEFAULT_BUTTONS.test,
    DEFAULT_LAB_BUTTONS.stepinfo,
    DEFAULT_LAB_BUTTONS.step,
    DEFAULT_BUTTONS.separator,
    DEFAULT_LAB_BUTTONS.solve,
    DEFAULT_BUTTONS.separator,
    DEFAULT_LAB_BUTTONS.download,
    DEFAULT_LAB_BUTTONS.upload,
    // DEFAULT_LAB_BUTTONS.camera,
    DEFAULT_LAB_BUTTONS.clear,
    DEFAULT_BUTTONS.separator,
    DEFAULT_LAB_BUTTONS.available,
    DEFAULT_LAB_BUTTONS.popupdetails
  ];
  title = 'Player';
  execute = (facade: LabFacade, code: string) => {
    switch (code) {
      case 'test': return facade.test();
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
