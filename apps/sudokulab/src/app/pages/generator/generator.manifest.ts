import {Injectable} from '@angular/core';
import {GeneratorAction, GeneratorData, SudokuLab, SudokulabPage} from '@sudokulab/model';
import {AvailablePages, DEFAULT_BUTTONS, DEFAULT_GENERATOR_BUTTONS} from '../../model';
import {GeneratorComponent} from './generator.component';
import {Routes} from '@angular/router';
import {GeneratorExecutor} from "./generator.executor";

@Injectable({
  providedIn: "root"
})
export class GeneratorManifest extends SudokulabPage {
  code = AvailablePages.generator;
  icon = 'settings';
  buttons = [
    DEFAULT_GENERATOR_BUTTONS.generate,
    DEFAULT_BUTTONS.separator,
    DEFAULT_GENERATOR_BUTTONS.downloadAll,
    DEFAULT_GENERATOR_BUTTONS.removeAll,
    DEFAULT_BUTTONS.separator,
    DEFAULT_GENERATOR_BUTTONS.download,
    DEFAULT_BUTTONS.upload,
    DEFAULT_GENERATOR_BUTTONS.clear
  ];
  title = 'Generator';
  executor = 'generator-executor';
  getUrl(sl: SudokuLab): string {
    return `${AvailablePages.generator}`;
  }
  static routes = (): Routes => [{
    path: `${AvailablePages.generator}`,
    component: GeneratorComponent
  }];
}
