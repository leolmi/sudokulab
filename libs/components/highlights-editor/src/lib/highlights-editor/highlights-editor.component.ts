import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { BoardManager } from '@olmi/board';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'highlights-editor',
  imports: [
    MatFormFieldModule,
    CdkTextareaAutosize,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './highlights-editor.component.html',
  styleUrl: './highlights-editor.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsEditorComponent {
  readonly manager = input<BoardManager | null | undefined>(null);

  readonly text = signal<string>('');
  readonly active = signal<boolean>(true);

  constructor() {
    // text + active → highlights del manager (con reset quando active diventa false)
    effect(() => {
      const m = this.manager();
      const txt = this.text();
      const isActive = this.active();
      if (!m) return;
      m.setHighlights(isActive ? txt : undefined);
    });
  }

  toggleLink() {
    this.active.update(v => !v);
  }

  clear() {
    this.text.set('');
  }

  setText(e: any) {
    this.text.set(e.target.value);
  }
}
