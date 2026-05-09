import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Dictionary, isEmpty, Sudoku } from '@olmi/model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { isArray as _isArray, isNumber as _isNumber, keys as _keys } from 'lodash';
import { getAlgorithm } from '@olmi/algorithms';
import { MatBadgeModule } from '@angular/material/badge';
import { ALGORITHM_INFO_DIALOG_CONFIG, AlgorithmInfoDialogComponent } from '@olmi/algorithm-info';

interface MapItem {
  id: string;
  name: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'schema-header',
  imports: [
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  templateUrl: './schema-header.component.html',
  styleUrl: './schema-header.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaHeaderComponent {
  private readonly _dialog = inject(MatDialog);

  readonly schema = input<Sudoku | null | undefined>(undefined);

  readonly isEmpty = computed<boolean>(() => {
    const s = this.schema();
    return !s || isEmpty(s);
  });

  readonly difficultyMap = computed<MapItem[]>(() => {
    const sdk = this.schema();
    const diff_map = sdk?.info.difficultyMap || {};
    return _keys(diff_map).map(k => {
      const alg = getAlgorithm(k);
      return <MapItem>{
        id: k,
        icon: alg?.icon || '',
        name: alg?.name || '',
        value: getDiffCount(diff_map, k),
      };
    });
  });

  openAlgorithmInfo(id: string) {
    this._dialog.open(AlgorithmInfoDialogComponent, {
      ...ALGORITHM_INFO_DIALOG_CONFIG,
      data: { algorithmId: id },
    });
  }
}

const getDiffCount = (diff_map: Dictionary<number[]>|undefined, alg_name: string): number => {
  const algN: any = (diff_map || {})[alg_name];
  return _isNumber(algN) ? <number>algN : _isArray(algN) ? algN.length : 0;
}
