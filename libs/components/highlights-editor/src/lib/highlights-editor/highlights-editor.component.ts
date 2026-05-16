import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { BoardManager } from '@olmi/board';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nDirective, TranslateService } from '@olmi/common';

@Component({
  selector: 'highlights-editor',
  standalone: true,
  imports: [
    MatFormFieldModule,
    CdkTextareaAutosize,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatTooltipModule,
    I18nDirective,
  ],
  templateUrl: './highlights-editor.component.html',
  styleUrl: './highlights-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsEditorComponent {
  private readonly _manager = inject(BoardManager);
  readonly tr = inject(TranslateService);

  readonly text = signal<string>('');
  readonly active = signal<boolean>(true);

  constructor() {
    // text + active → highlights del manager (con reset quando active diventa false)
    effect(() => {
      const txt = this.text();
      const isActive = this.active();
      this._manager.setHighlights(isActive ? txt : undefined);
    });
  }

  toggleLink() {
    this.active.update(v => !v);
  }

  clear() {
    this.text.set('');
  }

  setText(e: Event) {
    this.text.set((e.target as HTMLInputElement).value);
  }
}
