import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dictionary, isEmpty, LocalContext, SDK_PREFIX, Sudoku } from '@olmi/model';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { FlexModule } from '@angular/flex-layout';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { isArray as _isArray, isNumber as _isNumber, keys as _keys } from 'lodash';
import { getAlgorithm } from '@olmi/algorithms';
import { MatBadgeModule } from '@angular/material/badge';

interface MapItem {
  name: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'schema-header',
  imports: [
    CommonModule,
    FlexModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './schema-header.component.html',
  styleUrl: './schema-header.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaHeaderComponent {
  schema$: BehaviorSubject<Sudoku|undefined>;
  difficultyMap$: Observable<MapItem[]>;
  isEmpty$: Observable<boolean>;

  @Input()
  set schema(s: Sudoku|undefined|null) {
    this.schema$.next(s||undefined);
  }

  constructor() {
    this.schema$ = new BehaviorSubject<Sudoku|undefined>(undefined);
    this.isEmpty$ = this.schema$.pipe(map(s => !s || isEmpty(s)));

    this.difficultyMap$ = this.schema$.pipe(map(sdk => {
      const diff_map = sdk?.info.difficultyMap||{};
      return _keys(diff_map).map(k => {
        const alg = getAlgorithm(k);
        return <MapItem>{
          icon: alg?.icon||'',
          name: alg?.name||'',
          value: getDiffCount(diff_map, k)
        }
      });
    }));
  }
}

const getDiffCount = (diff_map: Dictionary<number[]>|undefined, alg_name: string): number => {
  const algN: any = (diff_map || {})[alg_name];
  return _isNumber(algN) ? <number>algN : _isArray(algN) ? algN.length : 0;
}
