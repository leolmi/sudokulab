import {
  Directive,
  ElementRef,
  OnInit,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService } from './translate.service';

type I18nParams = Record<string, string | number> | undefined;

/**
 * Direttiva di traduzione del contenuto testuale di un elemento.
 *
 * Convenzione: la chiave è il `textContent` statico dell'elemento (lingua di
 * default = `en`). Per disambiguare chiavi identiche o evitare collisioni si
 * passa la chiave esplicita come valore: `appI18n="explicit.key"`.
 *
 * Per stringhe parametriche, scrivere i segnaposti `{name}` direttamente nel
 * testo del template e passare i valori via `[appI18nParams]`:
 *
 * ```html
 * <div appI18n [appI18nParams]="{ n: count() }">Found {n} puzzles</div>
 * ```
 *
 * NB: il selector NON è `[i18n]` per evitare collisione con l'attributo
 * speciale del template compiler di Angular.
 */
@Directive({
  selector: '[appI18n]',
  standalone: true,
})
export class I18nDirective implements OnInit {
  private readonly _el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _tr = inject(TranslateService);

  readonly appI18n = input<string>('');
  readonly appI18nParams = input<I18nParams>(undefined);

  private readonly _defaultKey = signal('');

  constructor() {
    effect(() => {
      const key = this.appI18n() || this._defaultKey();
      if (!key) return;
      this._el.nativeElement.textContent = this._tr.t(key, this.appI18nParams());
    });
  }

  ngOnInit(): void {
    if (!this.appI18n()) {
      this._defaultKey.set((this._el.nativeElement.textContent || '').trim());
    }
  }
}

/**
 * Variante di {@link I18nDirective} per il `matTooltip` di Angular Material.
 *
 * Compone `MatTooltip` come host directive: basta scrivere
 * `<button appI18nTooltip>...</button>` (il tooltip viene istanziato
 * automaticamente). La chiave segue la stessa convenzione di {@link I18nDirective}:
 * valore esplicito o, in mancanza, `textContent` dell'elemento.
 *
 * ```html
 * <button appI18nTooltip>Solve</button>
 * <button appI18nTooltip="Solve current puzzle">Solve</button>
 * <button appI18n appI18nTooltip="Solve current puzzle">Solve</button>
 * ```
 */
@Directive({
  selector: '[appI18nTooltip]',
  standalone: true,
  hostDirectives: [MatTooltip],
})
export class I18nMatTooltipDirective implements OnInit {
  private readonly _el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _tr = inject(TranslateService);
  private readonly _tooltip = inject(MatTooltip, { self: true });

  readonly appI18nTooltip = input<string>('');
  readonly appI18nParams = input<I18nParams>(undefined);

  private readonly _defaultKey = signal('');

  constructor() {
    effect(() => {
      const key = this.appI18nTooltip() || this._defaultKey();
      if (!key) return;
      this._tooltip.message = this._tr.t(key, this.appI18nParams());
    });
  }

  ngOnInit(): void {
    if (!this.appI18nTooltip()) {
      this._defaultKey.set((this._el.nativeElement.textContent || '').trim());
    }
  }
}
