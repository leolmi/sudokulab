import { Pipe, PipeTransform } from '@angular/core';
import { Sudoku } from '@olmi/model';

@Pipe({
  name: 'itemTooltip',
  standalone: true
})
export class ItemTooltipPipe implements PipeTransform {
  constructor() {}

  transform(sdk: Sudoku|undefined): string {
    return sdk ?
      `${sdk.info.fixedCount} ${sdk.info.difficulty||'unknown'} (${sdk.info.difficultyValue})${sdk.info.tryAlgorithmCount>0?` T${sdk.info.tryAlgorithmCount}`:''}`
      : 'unknown';
  }
}
