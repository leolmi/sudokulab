import { PrintPageEx } from './print-page';
import { Type } from '@angular/core';

export abstract class PrintTemplate {
  abstract name: string;
  abstract icon: string;
  abstract description: string;
  abstract size: string;
  abstract direction: string;
  abstract pagesForPage: number;
  abstract compose: (page: PrintPageEx, last?: boolean) => string;
  abstract editor: Type<any>;
}
