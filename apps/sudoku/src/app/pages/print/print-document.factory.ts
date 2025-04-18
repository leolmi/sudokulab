import { PRINT_USER_OPTIONS_FEATURE } from './print.model';
import { DEFAULT_PRINT_TEMPLATE } from '@olmi/model';
import { AppUserOptions, PrintDocument } from '@olmi/common';

export const printDocumentFactory = (): PrintDocument => {
  const o = AppUserOptions.getFeatures<any>(PRINT_USER_OPTIONS_FEATURE);
  return new PrintDocument(o.template||DEFAULT_PRINT_TEMPLATE);
}
