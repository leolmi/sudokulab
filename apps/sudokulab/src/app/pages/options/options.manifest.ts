import {Injectable} from "@angular/core";
import { OptionsFacade, SudokulabPage } from '@sudokulab/model';
import {AvailablePages} from "../../model";
import { OptionsComponent } from './options.component';
import { Routes } from '@angular/router';

@Injectable()
export class OptionsManifest extends SudokulabPage {
  code = AvailablePages.options;
  icon = 'rule';
  buttons = [
    {icon: 'settings_backup_restore', code: 'reset', tooltip: 'Reset to default'}];
  title = 'Options';
  execute = (facade: OptionsFacade, code: string) => {
    switch (code) {
      case 'reset': return facade.reset();
    }
  };
  static routes = (): Routes => [{
    path: `${AvailablePages.options}`,
    component: OptionsComponent
  }];
}
