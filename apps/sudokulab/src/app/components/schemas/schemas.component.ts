import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { LabFacade, PlaySudoku } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DestroyComponent } from '../DestroyComponent';

@Component({
  selector: 'sudokulab-schemas',
  templateUrl: './schemas.component.html',
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasComponent extends DestroyComponent implements OnDestroy {
  schemas$: Observable<PlaySudoku[]>;
  activeId$: Observable<number>;

  constructor(private _lab: LabFacade) {
    super();
    this.schemas$ = _lab.selectAllSchemas$.pipe(
      takeUntil(this._destroy$));
    this.activeId$ = _lab.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?._id||0));
  }

  select(schema: PlaySudoku) {
    this._lab.setActiveSudoku(schema._id);
  }
}
