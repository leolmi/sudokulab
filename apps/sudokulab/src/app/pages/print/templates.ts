import { PrintTemplate, SUDOKULAB_DEFAULT_TEMPLATE } from '@sudokulab/model';

export const templates: {[name: string]: PrintTemplate} = {
  template_1: {
    code: SUDOKULAB_DEFAULT_TEMPLATE,
    name: 'template 1 schema',
    file: 'print-1-schema.html',
    thumbnail: '',
    schemaCount: 1,
    bookmark: {
      'subtitle': '',
      'footer': ''
    }
  },
  template_2: {
    code: 'T02',
    name: 'template 2 schema',
    file: 'print-2-schema.html',
    thumbnail: '',
    schemaCount: 2,
    bookmark: {
      'subtitle': '',
      'footer': ''
    }
  }
};
