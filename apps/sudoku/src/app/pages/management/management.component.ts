import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageBase } from '../../model/page.base';
import { MenuItem, NotificationType } from '@olmi/model';
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

  async handleMenuItem(item: MenuItem) {
    switch (item.property) {
      case 'upload': {
        this.working.set(true);
        try {
          const r = await this.interaction.updateCatalog();
          this.notifier.notify('upload terminated', r ? NotificationType.success : NotificationType.error);
          console.log('UPLOAD RESULT', r);
        } catch (err) {
          console.error('upload failed', err);
          this.notifier.notify('upload terminated', NotificationType.error);
        } finally {
          this.working.set(false);
        }
        break;
      }
    }
  }
}
