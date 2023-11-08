import {Injectable} from '@angular/core';
import {SudokuLab, SudokulabPage} from '@sudokulab/model';
import {AvailablePages, DEFAULT_BUTTONS, DEFAULT_LAB_BUTTONS} from '../../model';
import {LabComponent} from './lab.component';
import {Routes} from '@angular/router';

@Injectable({
  providedIn: "root"
})
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
    DEFAULT_BUTTONS.upload,
    DEFAULT_LAB_BUTTONS.camera,
    DEFAULT_LAB_BUTTONS.clear,
    DEFAULT_BUTTONS.separator,
    DEFAULT_LAB_BUTTONS.available,
    DEFAULT_LAB_BUTTONS.popupdetails
  ];
  title = 'Player';
  executor = 'lab-executor';
  getUrl(sl: SudokuLab): string {
    const base = `${AvailablePages.lab}`;
    const sdk_id = sl.state.activeSudokuId$.value;
    return sdk_id ? `${base}/${sdk_id}` : base;
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
