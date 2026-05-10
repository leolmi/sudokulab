import { inject, Pipe, PipeTransform } from '@angular/core';
import { Sudoku } from '@olmi/model';
import { AppUserOptions, TranslateService } from '@olmi/common';

@Pipe({
  name: 'itemTooltip',
  standalone: true,
  pure: false,
})
export class ItemTooltipPipe implements PipeTransform {
  private readonly _tr = inject(TranslateService);

  transform(sdk: Sudoku|undefined): string {
    if (!sdk) return this._tr.t('unknown');
    const diff = this._tr.t(sdk.info.difficulty||'unknown');
    return `${sdk.info.fixedCount} ${diff} (${sdk.info.difficultyValue})${sdk.info.tryAlgorithmCount>0?` T${sdk.info.tryAlgorithmCount}`:''}`;
  }
}


@Pipe({
  name: 'userPlaying',
  standalone: true
})
export class UserPlayingPipe implements PipeTransform {
  constructor() {}

  transform(sdk: Sudoku|undefined): boolean {
    return !!AppUserOptions.getUserValues(sdk?._id);
  }
}
