import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageBase } from '../../model/page.base';
import { MenuItem, NotificationType } from '@olmi/model';
import { catchError, of } from 'rxjs';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  imports: [
    MatProgressBar,
  ],
  selector: 'sudoku-management',
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementComponent extends PageBase {
  readonly working = signal<boolean>(false);

  constructor() {
    super();
    this.state.menuHandler = (item) => this.handleMenuItem(item);
  }

  handleMenuItem(item: MenuItem) {
    switch (item.property) {
      case 'upload':
        this.working.set(true);
        this.interaction.updateCatalog()
          .pipe(catchError(() => {
            this.working.set(false);
            return of(undefined);
          }), takeUntilDestroyed(this._destroyRef))
          .subscribe(r => {
            this.working.set(false);
            this.notifier.notify('upload terminated', !!r ? NotificationType.success : NotificationType.error);
            console.log('UPLOAD RESULT', r);
          });
        break;
    }
  }
}
