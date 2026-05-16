import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { I18nDirective, TranslateService } from '@olmi/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, I18nDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ tr.t(data.title) }}</h2>
    <mat-dialog-content>{{ tr.t(data.message) }}</mat-dialog-content>
    <mat-dialog-actions class="flex-row flex-align-end-center flex-gap-8">
      <button mat-button [mat-dialog-close]="false" appI18n>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true" appI18n>Continue</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 320px; max-width: 520px; }
  `],
})
export class ConfirmDialogComponent {
  readonly tr = inject(TranslateService);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
