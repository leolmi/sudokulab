import { Pipe, PipeTransform } from '@angular/core';
import {getSchemaName, PlaySudoku, Sudoku} from '@sudokulab/model';

@Pipe({name: 'schemaName'})
export class SchemaNamePipe implements PipeTransform {
  transform(value: PlaySudoku|Sudoku|undefined): string {
    return getSchemaName(value, { separator: ' ', hideHash: true });
  }
}
