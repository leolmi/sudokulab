import { Pipe, PipeTransform } from '@angular/core';
import { getSchemaName, PlaySudoku } from '@sudokulab/model';

@Pipe({name: 'schemaName'})
export class SchemaNamePipe implements PipeTransform {
  transform(value: PlaySudoku): string {
    return getSchemaName(value, { separator: ' ' });
  }
}
