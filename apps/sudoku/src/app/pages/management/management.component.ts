import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageBase } from '../../model/page.base';
import { NotificationType } from '@olmi/model';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MenuItem } from '@olmi/common';

@Component({
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatProgressBar
  ],
  selector: 'sudoku-management',
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagementComponent extends PageBase {
  working$: BehaviorSubject<boolean>;

  constructor() {
    super();
    this.working$ = new BehaviorSubject<boolean>(false);

    this.state.menuHandler = (item) => this.handleMenuItem(item);
  }


  handleMenuItem(item: MenuItem) {
    switch (item.property) {
      case 'upload':
        this.working$.next(true);
        this.interaction.updateCatalog()
          .pipe(catchError((err) => {
            this.working$.next(false);
            return of(undefined);
          }))
          .subscribe(r => {
            this.working$.next(false);
            this.notifier.notify('upload terminated', !!r ? NotificationType.success : NotificationType.error);
            console.log('UPLOAD RESULT', r);
          });
        break;
    }
  }
}
