import { Injectable } from '@angular/core';
import { SudokulabPage, PrintFacade } from '@sudokulab/model';
import { AvailablePages } from '../../model';

@Injectable()
export class PrintManifest extends SudokulabPage {
  code = AvailablePages.print;
  icon = 'print';
  buttons = [];
  title = 'Print';
  execute = (facade: PrintFacade, code: string) => {
    switch (code) {

    }
  }
}
