import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { BoardManager } from '@olmi/board';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AppUserOptions, HIGHLIGHTS_EDITOR_FEATURE, I18nDirective, TranslateService } from '@olmi/common';

interface HighlightsEditorPersistence {
  text?: string;
  active?: boolean;
}

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
  private readonly _router = inject(Router);
  readonly tr = inject(TranslateService);

  // stato ripristinato da localStorage all'init: highlights digitati e flag di
  // visibilità sopravvivono a navigazione fra pagine e reload del browser.
  private readonly _persisted = AppUserOptions.getFeatures<HighlightsEditorPersistence>(HIGHLIGHTS_EDITOR_FEATURE, {});
  readonly text = signal<string>(this._persisted.text ?? '');
  readonly active = signal<boolean>(this._persisted.active ?? true);

  constructor() {
    // text + active → highlights del manager (con reset quando active diventa false)
    // + persistenza su localStorage. Anche il flag `active` viene persistito, così
    // l'utente trova lo stesso stato (on/off + testo) a ogni riapertura della pagina.
    effect(() => {
      const txt = this.text();
      const isActive = this.active();
      this._manager.setHighlights(isActive ? txt : undefined);
      untracked(() => AppUserOptions.updateFeature(HIGHLIGHTS_EDITOR_FEATURE, <HighlightsEditorPersistence>{
        text: txt,
        active: isActive,
      }));
    });

    // Re-apply al cambio schema: `BoardManager.load()` chiama `clearHighlights()`
    // dopo il `_sudoku.set(...)`, quindi senza questo effect gli highlights utente
    // verrebbero spazzati via a ogni navigazione/load e l'apertura della pagina
    // mostrerebbe sempre la board "spenta" anche con testo+active persistiti.
    effect(() => {
      this._manager.sudoku();
      untracked(() => {
        const txt = this.text();
        const isActive = this.active();
        if (isActive && txt) this._manager.setHighlights(txt);
      });
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

  // Apre la pagina Infos posizionata sulla sezione `Evidenze`. Il fragment
  // `help-highlights` corrisponde all'id ancora generato dal markdown
  // (`## Evidenze {#help-highlights}`); la pagina Infos lo intercetta e
  // scorre fino all'elemento una volta renderizzato il contenuto.
  openHelp() {
    this._router.navigate(['/infos'], { fragment: 'help-highlights' });
  }
}
